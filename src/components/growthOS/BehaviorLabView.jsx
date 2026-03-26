import React, { useState, useMemo } from "react";
// Change these paths if your folder structure is different
import { Button } from "../components/ui/button"; 
import { 
  ChevronLeft, ChevronRight, Calendar, TrendingUp, 
  TrendingDown, Minus, Zap, Target, Activity 
} from "lucide-react";
import { format, startOfWeek, addDays, addWeeks } from "date-fns";
import { usePreferences } from "../hooks/usePreferences"; // Adjust path
import Card from "../components/Card"; // Adjust path

// Convert log value to activity points
function logToActivityPoints(log, category) {
  const value = log.value || 0;
  const unit = category?.unit || "count";
  
  switch (unit) {
    case "minutes": return value;
    case "hours": return value * 60;
    case "pages": return value * 2;
    case "count": return value * 10;
    case "score": return value * 15;
    default: return value;
  }
}

// Calculate metrics for a week
function analyzeWeek(entries, categories, weekDates) {
  const dateSet = new Set(weekDates.map(d => d.date));
  const weekEntries = entries.filter(e => dateSet.has(e.date));
  
  const dailyPoints = {};
  weekDates.forEach(d => { dailyPoints[d.date] = 0; });
  
  const allLogs = [];
  const usedCategories = new Set();
  
  weekEntries.forEach(entry => {
    entry.logs.forEach(log => {
      const cat = categories.find(c => c.id === log.categoryId);
      const points = logToActivityPoints(log, cat);
      dailyPoints[entry.date] = (dailyPoints[entry.date] || 0) + points;
      allLogs.push({ ...log, date: entry.date, points });
      if (log.categoryId) usedCategories.add(log.categoryId);
    });
  });
  
  const dayPointsArray = Object.values(dailyPoints);
  const activeDays = dayPointsArray.filter(p => p > 0).length;
  const totalLogs = allLogs.length;
  const totalWeekPoints = dayPointsArray.reduce((sum, p) => sum + p, 0);
  
  const mean = totalWeekPoints / 7;
  const variance = dayPointsArray.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / 7;
  const std = Math.sqrt(variance);
  
  let consistencyScore = 0;
  if (mean > 0) {
    const consistency = Math.max(0, Math.min(1, 1 - (std / (mean + 1e-9))));
    consistencyScore = Math.round(consistency * 100);
  }
  
  const intensityIndex = activeDays > 0 ? Math.round(totalWeekPoints / activeDays) : 0;
  
  let volatilityLevel = "Low";
  if (mean > 0) {
    if (std >= 1.2 * mean) volatilityLevel = "High";
    else if (std >= 0.6 * mean) volatilityLevel = "Medium";
  } else if (std > 0) {
    volatilityLevel = "High";
  }
  
  const activeCategories = categories.filter(c => c.isActive).length;
  const diversity = activeCategories > 0 ? usedCategories.size / activeCategories : 0;
  
  const weekendPoints = (dailyPoints[weekDates[5]?.date] || 0) + (dailyPoints[weekDates[6]?.date] || 0);
  const weekdayPoints = totalWeekPoints - weekendPoints;
  const weekendHeavy = weekendPoints > weekdayPoints * 1.5 && totalWeekPoints > 0;
  
  return {
    activeDays,
    totalLogs,
    consistencyScore,
    intensityIndex,
    volatilityLevel,
    diversity,
    totalWeekPoints,
    mean,
    std,
    weekendHeavy,
    dailyPoints,
    usedCategories: usedCategories.size,
  };
}

function classifyProfile(metrics) {
  const { activeDays, volatilityLevel, intensityIndex, diversity, totalWeekPoints, weekendHeavy } = metrics;
  
  if (totalWeekPoints === 0) {
    return {
      name: "Off Week",
      confidence: 100,
      summary: "No activity logged this week.",
    };
  }
  
  let profile = null;
  let confidence = 50;
  
  if (diversity <= 0.25 && activeDays >= 4) {
    profile = { name: "Focus Specialist", summary: "Deep work in a single area." };
    confidence = 70 + (activeDays >= 6 ? 20 : 0);
  } else if (weekendHeavy) {
    profile = { name: "Weekend Warrior", summary: "Activity concentrated on weekends." };
    confidence = 80;
  } else if (activeDays >= 5 && volatilityLevel === "Low") {
    profile = { name: "Steady Builder", summary: "Consistent daily effort." };
    confidence = 85;
  } else {
    profile = { name: "Balanced Operator", summary: "Building momentum." };
    confidence = 50;
  }
  
  return { ...profile, confidence: Math.min(100, confidence) };
}

function generateInsights(metrics) {
  const insights = [];
  const { activeDays, volatilityLevel, intensityIndex } = metrics;
  if (activeDays >= 5) insights.push("Strong consistency this week.");
  if (volatilityLevel === "High") insights.push("Spiky output—try smoothing workload.");
  if (intensityIndex < 50 && activeDays >= 4) insights.push("Frequent but short sessions.");
  return insights.slice(0, 3);
}

export default function BehaviorLabView({ categories, entries }) {
  const { preferences } = usePreferences();
  const weekStartsOn = preferences?.weekStart === "sunday" ? 0 : 1;
  const [weekStart, setWeekStart] = useState(() => format(startOfWeek(new Date(), { weekStartsOn }), "yyyy-MM-dd"));
  
  const weekDates = useMemo(() => {
    const start = new Date(weekStart);
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i);
      return { date: format(d, "yyyy-MM-dd"), label: format(d, "EEE") };
    });
  }, [weekStart]);
  
  const currentWeekMetrics = useMemo(() => analyzeWeek(entries, categories, weekDates), [entries, categories, weekDates]);
  const lastWeekMetrics = useMemo(() => {
    const lastWeekStart = format(addWeeks(new Date(weekStart), -1), "yyyy-MM-dd");
    const lastWeekDates = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(new Date(lastWeekStart), i);
      return { date: format(d, "yyyy-MM-dd"), label: format(d, "EEE") };
    });
    return analyzeWeek(entries, categories, lastWeekDates);
  }, [entries, categories, weekStart]);

  const profile = useMemo(() => classifyProfile(currentWeekMetrics), [currentWeekMetrics]);
  const insights = useMemo(() => generateInsights(currentWeekMetrics), [currentWeekMetrics]);

  const getDelta = (current, previous) => {
    const delta = current - previous;
    const percent = previous > 0 ? Math.round((delta / previous) * 100) : (current > 0 ? 100 : 0);
    return { delta, percent };
  };

  const DeltaIndicator = ({ current, previous, suffix = "" }) => {
    const { delta, percent } = getDelta(current, previous);
    if (delta === 0) return <div className="text-[var(--muted)] text-sm"><Minus className="inline w-3 h-3" /> 0</div>;
    return (
      <div className={`text-sm ${delta > 0 ? "text-emerald-500" : "text-red-500"}`}>
        {delta > 0 ? <TrendingUp className="inline w-3 h-3" /> : <TrendingDown className="inline w-3 h-3" />} {delta}{suffix} ({percent}%)
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setWeekStart(format(addWeeks(new Date(weekStart), -1), "yyyy-MM-dd"))}><ChevronLeft /></Button>
        <span className="font-bold">{format(new Date(weekStart), "MMM d")} - {format(addDays(new Date(weekStart), 6), "MMM d")}</span>
        <Button variant="ghost" size="sm" onClick={() => setWeekStart(format(addWeeks(new Date(weekStart), 1), "yyyy-MM-dd"))}><ChevronRight /></Button>
      </div>

      {/* Profile Section */}
      <Card className="p-6 border-l-4 border-[var(--accent)]">
        <h2 className="text-2xl font-black">{profile.name}</h2>
        <p className="text-[var(--muted)]">{profile.summary}</p>
        <div className="mt-4 flex items-center gap-2">
           <div className="flex-1 h-2 bg-[var(--surface2)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--accent)]" style={{ width: `${profile.confidence}%` }} />
           </div>
           <span className="text-xs font-bold">{profile.confidence}%</span>
        </div>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4"><p className="text-xs uppercase text-[var(--muted)]">Active Days</p><p className="text-2xl font-bold">{currentWeekMetrics.activeDays}/7</p></Card>
        <Card className="p-4"><p className="text-xs uppercase text-[var(--muted)]">Intensity</p><p className="text-2xl font-bold">{currentWeekMetrics.intensityIndex}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase text-[var(--muted)]">Consistency</p><p className="text-2xl font-bold">{currentWeekMetrics.consistencyScore}%</p></Card>
      </div>

      {/* Comparison */}
      <Card className="p-4">
        <h3 className="text-sm font-bold mb-4">Vs. Previous Week</h3>
        <div className="space-y-2">
           <div className="flex justify-between"><span>Activity</span><DeltaIndicator current={currentWeekMetrics.totalWeekPoints} previous={lastWeekMetrics.totalWeekPoints} /></div>
           <div className="flex justify-between"><span>Active Days</span><DeltaIndicator current={currentWeekMetrics.activeDays} previous={lastWeekMetrics.activeDays} /></div>
        </div>
      </Card>
    </div>
  );
}