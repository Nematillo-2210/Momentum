import React, { useMemo } from "react";
import { Flame, Calendar, BookOpen, Dumbbell, Moon, FileText, Coffee, Music, Briefcase, Heart, Zap, Target, Activity, Award, TrendingUp, Users, Circle } from "lucide-react";
import { startOfWeek, addDays } from "date-fns";
import AnimatedNumber from "./AnimatedNumber";
import Card from "./Card";

const iconMap = { BookOpen, Dumbbell, Moon, FileText, Coffee, Music, Briefcase, Heart, Zap, Target, Activity, Award, TrendingUp, Users, Circle };

export default function DashboardCards({ categories, entries, getStreak }) {
  const weekStats = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const weekDates = Array.from({ length: 7 }, (_, i) => 
      addDays(start, i).toISOString().split("T")[0]
    );
    
    const weekEntries = entries.filter(e => weekDates.includes(e.date));
    const allLogs = weekEntries.flatMap(e => e.logs);
    
    const catStats = {};
    categories.forEach(cat => {
      const catLogs = allLogs.filter(l => l.categoryId === cat.id);
      catStats[cat.id] = catLogs.reduce((sum, l) => sum + (l.value || 0), 0);
    });
    
    const activeDays = new Set(weekEntries.map(e => e.date)).size;
    const totalLogs = allLogs.length;
    
    return { catStats, activeDays, totalLogs };
  }, [entries, categories]);

  const topCategories = useMemo(() => {
    return categories
      .filter(c => c.isActive && weekStats.catStats[c.id] > 0)
      .sort((a, b) => weekStats.catStats[b.id] - weekStats.catStats[a.id])
      .slice(0, 4);
  }, [categories, weekStats]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <Card>
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
            <Calendar className="w-4 h-4 md:w-5 md:h-5" />
          </div>
        </div>
        <div className="text-2xl md:text-3xl font-bold text-[var(--text)] tracking-tight">
          <AnimatedNumber value={weekStats.totalLogs} />
        </div>
        <div className="text-xs text-[var(--muted)] mt-1 font-medium uppercase tracking-wider">
          Total Logs
        </div>
        <div className="text-xs text-[var(--muted)] opacity-60 mt-1">
          {weekStats.activeDays} active days
        </div>
      </Card>

      {topCategories.map(cat => {
        const Icon = iconMap[cat.icon] || Circle;
        const value = weekStats.catStats[cat.id] || 0;
        const streak = getStreak(cat.id);
        return (
          <Card key={cat.id}>
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-xl bg-${cat.color}-500/10 text-${cat.color}-400`}>
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-1 text-orange-400 text-xs font-medium">
                  <Flame className="w-3.5 h-3.5" />
                  {streak}d
                </div>
              )}
            </div>
            <div className="text-2xl md:text-3xl font-bold text-[var(--text)] tracking-tight">
              <AnimatedNumber value={value} decimals={cat.unit === "hours" ? 1 : 0} />
            </div>
            <div className="text-xs text-[var(--muted)] mt-1 font-medium uppercase tracking-wider">
              {cat.name}
            </div>
            <div className="text-xs text-[var(--muted)] opacity-60 mt-0.5 capitalize">
              {cat.unit}
            </div>
          </Card>
        );
      })}
    </div>
  );
}