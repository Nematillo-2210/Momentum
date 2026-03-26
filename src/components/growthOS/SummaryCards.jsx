import React from "react";
import { Flame, BookOpen, Dumbbell, Moon, FileText, Coffee, Music, Briefcase, Heart, Zap, Target, Activity, Award, TrendingUp, Users, Circle } from "lucide-react";

const getColorClasses = (color) => ({
  gradient: `from-${color}-500/20 to-${color}-600/5`,
  text: `text-${color}-400`,
  border: `border-${color}-500/20`,
});

const getUnitLabel = (type, value) => {
  if (type === "minutes") return value === 1 ? "min" : "min";
  if (type === "hours") return value === 1 ? "hr" : "hrs";
  if (type === "pages") return value === 1 ? "pg" : "pgs";
  return "";
};

const iconMap = { BookOpen, Dumbbell, Moon, FileText, Coffee, Music, Briefcase, Heart, Zap, Target, Activity, Award, TrendingUp, Users, Circle };

export default function SummaryCards({ categories, stats, getStreak }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {categories.map((cat) => {
        const Icon = iconMap[cat.icon] || Circle;
        const colors = getColorClasses(cat.color);
        const val = stats[cat.id] ?? 0;
        const streak = getStreak(cat.id);
        const unit = getUnitLabel(cat.type, val);
        
        return (
          <div
            key={cat.id}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors.gradient} border ${colors.border} p-4 md:p-5 backdrop-blur-sm`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-xl bg-white/5 ${colors.text}`}>
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-1 text-orange-400 text-xs font-medium">
                  <Flame className="w-3.5 h-3.5" />
                  {streak}d
                </div>
              )}
            </div>
            <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {cat.type === "hours" ? val.toFixed(1) : Math.round(val)}
              {unit && <span className="text-sm font-normal text-zinc-400 ml-1">{unit}</span>}
            </div>
            <div className="text-xs text-zinc-400 mt-1 font-medium uppercase tracking-wider">
              {cat.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}