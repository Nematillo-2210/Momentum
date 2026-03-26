import React, { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, BookOpen, Dumbbell, Moon, FileText, Coffee, Music, Briefcase, Heart, Zap, Target, Activity, Award, TrendingUp, Users, Circle } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "./useTheme";
import { usePreferences } from "./usePreferences";
import Card from "./Card";
import ConsistencyHeatmap from "./ConsistencyHeatmap";

const iconMap = { BookOpen, Dumbbell, Moon, FileText, Coffee, Music, Briefcase, Heart, Zap, Target, Activity, Award, TrendingUp, Users, Circle };

const colorMap = {
  blue: "#3b82f6", emerald: "#10b981", violet: "#8b5cf6", amber: "#f59e0b",
  rose: "#f43f5e", cyan: "#06b6d4", pink: "#ec4899", orange: "#f97316",
  lime: "#84cc16", indigo: "#6366f1",
};

export default function StatsView({ categories, entries }) {
  const { preferences } = usePreferences();
  const weekStartsOn = preferences.weekStart === "sunday" ? 0 : 1;
  const [weekStart, setWeekStart] = useState(() => format(startOfWeek(new Date(), { weekStartsOn }), "yyyy-MM-dd"));
  const [selectedCatId, setSelectedCatId] = useState(categories.find(c => c.isActive)?.id || "");
  const { themeColors } = useTheme();

  const weekDates = useMemo(() => {
    const start = new Date(weekStart);
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i);
      return {
        date: format(d, "yyyy-MM-dd"),
        label: format(d, "EEE"),
      };
    });
  }, [weekStart]);

  const weekStats = useMemo(() => {
    const weekEntries = entries.filter(e => weekDates.some(d => d.date === e.date));
    const allLogs = weekEntries.flatMap(e => e.logs);
    
    const stats = {};
    categories.forEach(cat => {
      const catLogs = allLogs.filter(l => l.categoryId === cat.id);
      stats[cat.id] = catLogs.reduce((sum, l) => sum + (l.value || 0), 0);
    });
    
    return stats;
  }, [entries, weekDates, categories]);

  const chartData = useMemo(() => {
    if (!selectedCatId) return [];
    const cat = categories.find(c => c.id === selectedCatId);
    return weekDates.map(day => {
      const dayEntries = entries.filter(e => e.date === day.date);
      const dayLogs = dayEntries.flatMap(e => e.logs).filter(l => l.categoryId === selectedCatId);
      const total = dayLogs.reduce((sum, l) => sum + (l.value || 0), 0);
      return {
        name: day.label,
        value: cat?.unit === "hours" && dayLogs.length > 0 ? total / dayLogs.length : total,
      };
    });
  }, [entries, weekDates, selectedCatId, categories]);

  const activityData = useMemo(() => {
    return weekDates.map(day => {
      const dayEntries = entries.filter(e => e.date === day.date);
      const count = dayEntries.flatMap(e => e.logs).length;
      return { name: day.label, value: count };
    });
  }, [entries, weekDates]);

  const goToPrevWeek = () => setWeekStart(format(addWeeks(new Date(weekStart), -1), "yyyy-MM-dd"));
  const goToNextWeek = () => setWeekStart(format(addWeeks(new Date(weekStart), 1), "yyyy-MM-dd"));
  const goToThisWeek = () => setWeekStart(format(startOfWeek(new Date(), { weekStartsOn }), "yyyy-MM-dd"));
  const isThisWeek = weekStart === format(startOfWeek(new Date(), { weekStartsOn }), "yyyy-MM-dd");
  const weekEnd = format(addDays(new Date(weekStart), 6), "MMM d");

  const selectedCat = categories.find(c => c.id === selectedCatId);
  const Icon = iconMap[selectedCat?.icon] || Circle;

  return (
    <div className="space-y-6">
      <ConsistencyHeatmap entries={entries} categories={categories} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={goToPrevWeek} className="p-2 rounded-[var(--radius-md)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-all duration-[var(--transition-fast)]">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <div className="text-sm font-semibold text-[var(--text)]">
              {format(new Date(weekStart), "MMM d")} - {weekEnd}
            </div>
            <div className="text-xs text-[var(--muted)]">Weekly Stats</div>
          </div>
          <button onClick={goToNextWeek} className="p-2 rounded-[var(--radius-md)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-all duration-[var(--transition-fast)]">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {!isThisWeek && (
          <Button onClick={goToThisWeek} variant="outline" size="sm" className="border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] hover:bg-[var(--bg)] text-xs transition-all duration-[var(--transition-fast)]">
            <Calendar className="w-3 h-3 mr-1.5" />
            This Week
          </Button>
        )}
      </div>

      <Card hover={false}>
        <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Week Totals</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.filter(c => c.isActive).map(cat => (
            <div key={cat.id} className={`p-3 rounded-[var(--radius-lg)] border border-${cat.color}-500/20 bg-${cat.color}-500/10`}>
              <div className="text-xs text-[var(--muted)] uppercase tracking-wider mb-1 font-semibold">{cat.name}</div>
              <div className="text-xl font-bold text-[var(--text)] tabular-nums">
                {cat.unit === "hours" ? weekStats[cat.id]?.toFixed(1) : Math.round(weekStats[cat.id] || 0)} {cat.unit}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card hover={false}>
        <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Daily Activity</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke={themeColors.border} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: themeColors.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: themeColors.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}`, borderRadius: "12px" }} />
              <Bar dataKey="value" fill={themeColors.accent} radius={[8, 8, 0, 0]} name="logs" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card hover={false}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {selectedCat && <Icon className={`w-4 h-4 text-${selectedCat.color}-400`} />}
            <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">Category Breakdown</h3>
          </div>
          <Select value={selectedCatId} onValueChange={setSelectedCatId}>
            <SelectTrigger className="w-40 bg-[var(--surface2)] border-[var(--border)] text-[var(--text)] h-8 text-xs focus:ring-2 focus:ring-[var(--accent)]/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.filter(c => c.isActive).map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={themeColors.border} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: themeColors.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: themeColors.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}`, borderRadius: "12px" }} />
              <Bar dataKey="value" fill={colorMap[selectedCat?.color] || themeColors.accent} radius={[8, 8, 0, 0]} name={selectedCat?.unit || ""} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
