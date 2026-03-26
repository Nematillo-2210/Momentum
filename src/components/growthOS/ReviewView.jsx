import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Calendar,
  Sparkles, BookOpen, Dumbbell, Moon, FileText, Coffee, Music,
  Briefcase, Heart, Zap, Target, Activity, Award, Users, Circle,
  Minus
} from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, isSunday } from "date-fns";
import { usePreferences } from "./usePreferences";
import Card from "./Card";
import WeeklyRadarChart from "./WeeklyRadarChart";

const iconMap = {
  BookOpen, Dumbbell, Moon, FileText, Coffee, Music,
  Briefcase, Heart, Zap, Target, Activity, Award, TrendingUp, Users, Circle,
};

/* ─── helpers ─── */
const getWeekStart = (date, weekStartsOn = 1) =>
  format(startOfWeek(date, { weekStartsOn }), "yyyy-MM-dd");

const getWeekRange = (weekStart) => {
  const start = new Date(weekStart);
  return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), "yyyy-MM-dd"));
};

const aggregateWeek = (entries, categories, weekStart) => {
  const dates = getWeekRange(weekStart);
  const weekEntries = entries.filter(e => dates.includes(e.date));
  const allLogs = weekEntries.flatMap(e => e.logs);

  const dailyStats = dates.map(date => {
    const dayLogs = weekEntries.filter(e => e.date === date).flatMap(e => e.logs);
    const catValues = {};
    let score = 0;
    categories.forEach(cat => {
      const total = dayLogs.filter(l => l.categoryId === cat.id).reduce((s, l) => s + (l.value || 0), 0);
      catValues[cat.id] = total;
      if (cat.unit === "minutes") score += total;
      else if (cat.unit === "hours") score += total * 60;
      else score += total * 10;
    });
    return { date, ...catValues, score, hasData: dayLogs.length > 0 };
  });

  const daysWithData = dailyStats.filter(d => d.hasData);
  const best  = daysWithData.length > 0 ? daysWithData.reduce((a, b) => a.score > b.score ? a : b) : null;
  const worst = daysWithData.length > 0 ? daysWithData.reduce((a, b) => a.score < b.score ? a : b) : null;

  const totals = {};
  categories.forEach(cat => {
    totals[cat.id] = allLogs.filter(l => l.categoryId === cat.id).reduce((s, l) => s + (l.value || 0), 0);
  });

  return {
    totals,
    best,
    worst,
    activeDays: new Set(weekEntries.map(e => e.date)).size,
    totalLogs: allLogs.length,
    dailyPoints: Object.fromEntries(dailyStats.map(d => [d.date, d.score])),
  };
};

/* ─── Behavior Lab logic (inlined) ─── */
function logToPoints(log, cat) {
  const v = log.value || 0;
  switch (cat?.unit) {
    case "minutes": return v;
    case "hours":   return v * 60;
    case "pages":   return v * 2;
    case "score":   return v * 15;
    default:        return v * 10;
  }
}

function analyzeWeek(entries, categories, weekDates) {
  const dateSet = new Set(weekDates.map(d => d.date));
  const weekEntries = entries.filter(e => dateSet.has(e.date));
  const dailyPoints = {};
  weekDates.forEach(d => { dailyPoints[d.date] = 0; });
  const usedCats = new Set();

  weekEntries.forEach(entry => {
    entry.logs.forEach(log => {
      const cat = categories.find(c => c.id === log.categoryId);
      dailyPoints[entry.date] = (dailyPoints[entry.date] || 0) + logToPoints(log, cat);
      if (log.categoryId) usedCats.add(log.categoryId);
    });
  });

  const dayArr = Object.values(dailyPoints);
  const activeDays = dayArr.filter(p => p > 0).length;
  const total = dayArr.reduce((s, p) => s + p, 0);
  const mean = total / 7;
  const std = Math.sqrt(dayArr.reduce((s, p) => s + Math.pow(p - mean, 2), 0) / 7);
  const consistencyScore = mean > 0 ? Math.round(Math.max(0, Math.min(1, 1 - std / (mean + 1e-9))) * 100) : 0;
  const intensityIndex = activeDays > 0 ? Math.round(total / activeDays) : 0;
  const volatility = mean > 0 ? (std >= 1.2 * mean ? "High" : std >= 0.6 * mean ? "Medium" : "Low") : (std > 0 ? "High" : "Low");
  const activeCats = categories.filter(c => c.isActive).length;
  const diversity = activeCats > 0 ? usedCats.size / activeCats : 0;
  const weekendPts = (dailyPoints[weekDates[5]?.date] || 0) + (dailyPoints[weekDates[6]?.date] || 0);
  const weekdayPts = total - weekendPts;

  return { activeDays, total, consistencyScore, intensityIndex, volatility, diversity, usedCats: usedCats.size, weekendHeavy: weekendPts > weekdayPts * 1.5 && total > 0 };
}

function classifyProfile(m) {
  if (m.total === 0) return { name: "Off Week", summary: "No activity logged this week.", confidence: 100 };
  if (m.diversity <= 0.25 && m.activeDays >= 4)
    return { name: "Focus Specialist", summary: "Deep work in a single area.", confidence: Math.min(100, 70 + (m.activeDays >= 6 ? 20 : 0)) };
  if (m.weekendHeavy)
    return { name: "Weekend Warrior", summary: "Activity concentrated on weekends.", confidence: Math.min(100, 75 + (m.activeDays <= 3 ? 15 : 0)) };
  if (m.activeDays <= 3 && m.intensityIndex > 100 && m.volatility === "High")
    return { name: "Sprinter", summary: "Short bursts of high-intensity activity.", confidence: 85 };
  if (m.activeDays >= 5 && m.volatility === "Low")
    return { name: "Steady Builder", summary: "Consistent daily effort with minimal variance.", confidence: Math.min(100, 80 + (m.activeDays === 7 ? 15 : 0)) };
  if (m.diversity >= 0.45 && m.activeDays >= 4 && m.volatility !== "High")
    return { name: "Balanced Operator", summary: "Multiple categories with steady engagement.", confidence: 70 };
  return { name: "Steady Builder", summary: "Building momentum with regular activity.", confidence: 50 };
}

/* ─── Sub-components ─── */
const StatCard = ({ category, value }) => {
  const Icon = iconMap[category.icon] || Circle;
  return (
    <div className={`rounded-[var(--radius-lg)] border border-${category.color}-500/30 bg-[var(--surface)] p-4 transition-all duration-[var(--transition)] hover:shadow-[var(--shadow-md)]`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 text-${category.color}-400`} />
        <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{category.name}</span>
      </div>
      <div className="text-2xl font-bold text-[var(--text)] tabular-nums">
        {category.unit === "hours" ? value.toFixed(1) : Math.round(value)}
        <span className="text-sm text-[var(--muted)] ml-1">{category.unit}</span>
      </div>
    </div>
  );
};

const DayCard = ({ title, day, categories, icon: Icon }) => (
  <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-[var(--muted)]" />
      <span className="text-sm font-semibold text-[var(--text)]">{title}</span>
    </div>
    {!day ? (
      <p className="text-xs text-[var(--muted)]">No data this week</p>
    ) : (
      <>
        <div className="text-xs text-[var(--muted)] mb-2">{format(new Date(day.date), "EEEE, MMM d")}</div>
        <div className="space-y-1 text-xs">
          {categories.map(cat => {
            const val = day[cat.id];
            if (!val || val === 0) return null;
            const CatIcon = iconMap[cat.icon] || Circle;
            return (
              <div key={cat.id} className={`text-${cat.color}-400 flex items-center gap-1`}>
                <CatIcon className="w-3 h-3" />
                {val.toFixed(cat.unit === "hours" ? 1 : 0)} {cat.unit}
              </div>
            );
          })}
        </div>
      </>
    )}
  </div>
);

const ComparisonRow = ({ label, current, previous }) => {
  const delta = current - previous;
  const pct = previous > 0 ? Math.round((delta / previous) * 100) : (current > 0 ? 100 : 0);
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--text)] font-medium tabular-nums">{current.toFixed(1)}</span>
        {delta !== 0 ? (
          <div className={`flex items-center gap-1 text-xs font-medium ${delta > 0 ? "text-emerald-400" : "text-red-400"}`}>
            {delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(pct)}%
          </div>
        ) : <Minus className="w-3 h-3 text-[var(--muted)]" />}
      </div>
    </div>
  );
};

/* ─── Main component ─── */
export default function ReviewView({ categories, entries, saveWeeklyNote, getWeeklyNote, goals }) {
  const { preferences } = usePreferences();
  const weekStartsOn = preferences.weekStart === "sunday" ? 0 : 1;
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date(), weekStartsOn));
  const [note, setNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  React.useEffect(() => {
    setNote(getWeeklyNote(weekStart));
    setNoteSaved(false);
  }, [weekStart, getWeeklyNote]);

  const stats     = useMemo(() => aggregateWeek(entries, categories, weekStart), [entries, categories, weekStart]);
  const prevStart = format(addWeeks(new Date(weekStart), -1), "yyyy-MM-dd");
  const prevStats = useMemo(() => aggregateWeek(entries, categories, prevStart), [entries, categories, prevStart]);

  // Behavior Lab metrics
  const weekDates = useMemo(() => {
    const start = new Date(weekStart);
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i);
      return { date: format(d, "yyyy-MM-dd"), label: format(d, "EEE") };
    });
  }, [weekStart]);

  const behaviorMetrics = useMemo(() => analyzeWeek(entries, categories, weekDates), [entries, categories, weekDates]);
  const profile = useMemo(() => classifyProfile(behaviorMetrics), [behaviorMetrics]);

  const goToPrevWeek = () => setWeekStart(format(addWeeks(new Date(weekStart), -1), "yyyy-MM-dd"));
  const goToNextWeek = () => setWeekStart(format(addWeeks(new Date(weekStart), 1), "yyyy-MM-dd"));
  const goToThisWeek = () => setWeekStart(getWeekStart(new Date(), weekStartsOn));
  const isThisWeek = weekStart === getWeekStart(new Date(), weekStartsOn);
  const weekEnd = format(addDays(new Date(weekStart), 6), "MMM d");
  const activeCategories = categories.filter(c => c.isActive);

  const handleSaveNote = () => {
    saveWeeklyNote(weekStart, note);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Week Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={goToPrevWeek} className="p-2 rounded-[var(--radius)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <div className="text-sm font-semibold text-[var(--text)]">{format(new Date(weekStart), "MMM d")} – {weekEnd}</div>
            <div className="text-xs text-[var(--muted)]">Week Review</div>
          </div>
          <button onClick={goToNextWeek} className="p-2 rounded-[var(--radius)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {!isThisWeek && (
          <Button onClick={goToThisWeek} variant="outline" size="sm"
            className="border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] hover:bg-[var(--bg)] text-xs">
            <Calendar className="w-3 h-3 mr-1.5" />This Week
          </Button>
        )}
      </div>

      {/* Sunday prompt */}
      {isSunday(new Date()) && isThisWeek && stats.totalLogs > 0 && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-violet-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold text-[var(--text)]">It's Sunday — Review Your Week</div>
            <div className="text-xs text-[var(--muted)] mt-0.5">Reflect on your progress and set intentions for next week.</div>
          </div>
        </div>
      )}

      {/* ── Weekly Performance Profile (Behavior Lab merged) ── */}
      <Card hover={false}>
        <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Weekly Performance Profile</h3>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-2xl font-bold text-[var(--text)] mb-0.5">{profile.name}</div>
            <div className="text-sm text-[var(--muted)]">{profile.summary}</div>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <div className="text-xs text-[var(--muted)] uppercase tracking-wider mb-0.5">Confidence</div>
            <div className="text-2xl font-bold text-[var(--accent)]">{profile.confidence}%</div>
          </div>
        </div>
        <div className="w-full h-1.5 rounded-full bg-[var(--surface2)] overflow-hidden mb-4">
          <div className="h-full bg-[var(--accent)] transition-all duration-700"
            style={{ width: `${profile.confidence}%` }} />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
          {[
            { label: "Active Days", value: `${behaviorMetrics.activeDays}/7` },
            { label: "Consistency", value: `${behaviorMetrics.consistencyScore}%` },
            { label: "Intensity", value: behaviorMetrics.intensityIndex },
            { label: "Volatility", value: behaviorMetrics.volatility,
              color: behaviorMetrics.volatility === "Low" ? "text-emerald-400" : behaviorMetrics.volatility === "Medium" ? "text-amber-400" : "text-red-400" },
            { label: "Diversity", value: `${Math.round(behaviorMetrics.diversity * 100)}%` },
            { label: "Categories", value: behaviorMetrics.usedCats },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-2 rounded-lg bg-[var(--surface2)]">
              <div className={`text-base font-bold tabular-nums ${color || "text-[var(--text)]"}`}>{value}</div>
              <div className="text-[10px] text-[var(--muted)] mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <WeeklyRadarChart categories={activeCategories} weekTotals={stats.totals} goals={goals} />
      </Card>

      {/* Summary */}
      <Card hover={false}>
        <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-[var(--muted)]">Active Days</div>
            <div className="text-[var(--text)] font-semibold text-xl mt-1">{stats.activeDays}</div>
          </div>
          <div>
            <div className="text-[var(--muted)]">Total Logs</div>
            <div className="text-[var(--text)] font-semibold text-xl mt-1">{stats.totalLogs}</div>
          </div>
        </div>
      </Card>

      {/* Category totals */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {activeCategories.map(cat => (
          <StatCard key={cat.id} category={cat} value={stats.totals[cat.id] || 0} />
        ))}
      </div>

      {/* Best / Worst */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DayCard title="Best Day"  day={stats.best}  categories={activeCategories} icon={TrendingUp} />
        <DayCard title="Worst Day" day={stats.worst} categories={activeCategories} icon={TrendingDown} />
      </div>

      {/* vs Previous Week */}
      <Card hover={false}>
        <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">vs Previous Week</h3>
        {activeCategories.map(cat => (
          <ComparisonRow
            key={cat.id}
            label={cat.name}
            current={stats.totals[cat.id] || 0}
            previous={prevStats.totals[cat.id] || 0}
          />
        ))}
      </Card>

      {/* Weekly Notes */}
      <Card hover={false}>
        <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">Weekly Notes</h3>
        <Textarea
          placeholder="Reflect on this week..."
          value={note}
          onChange={e => setNote(e.target.value)}
          className="bg-[var(--surface2)] border-[var(--border)] text-[var(--text)] min-h-[120px] resize-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all"
        />
        <div className="flex justify-end mt-3">
          <Button
            onClick={handleSaveNote}
            className={`transition-all active:scale-95 ${noteSaved ? "bg-emerald-600 hover:bg-emerald-600" : "bg-[var(--accent)] hover:opacity-90"} text-white`}
          >
            {noteSaved ? "Saved ✓" : "Save Note"}
          </Button>
        </div>
      </Card>
    </div>
  );
}