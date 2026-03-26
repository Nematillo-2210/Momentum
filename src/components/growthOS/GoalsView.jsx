import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Edit2, Check, X,
  BookOpen, Dumbbell, Moon, FileText, Coffee, Music,
  Briefcase, Heart, Zap, Target, Activity, Award, TrendingUp, Users, Circle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { startOfWeek, addDays } from "date-fns";
import { usePreferences } from "./usePreferences";

const iconMap = {
  BookOpen, Dumbbell, Moon, FileText, Coffee, Music,
  Briefcase, Heart, Zap, Target, Activity, Award, TrendingUp, Users, Circle,
};

/** Animated progress bar that springs from 0 → target width on mount */
function AnimatedBar({ pct, color }) {
  const [width, setWidth] = useState(0);
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const id = requestAnimationFrame(() => setWidth(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  // Keep it updated if pct changes after mount
  useEffect(() => { setWidth(pct); }, [pct]);

  return (
    <div
      className="w-full h-2 rounded-full overflow-hidden"
      style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${width}%`,
          backgroundColor: color,
          transition: "width 900ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: `0 0 8px ${color}55`,
        }}
      />
    </div>
  );
}

/** Resolve a Tailwind color name to an actual CSS color value */
const COLOR_MAP = {
  blue:    "#3b82f6",
  green:   "#22c55e",
  purple:  "#a855f7",
  pink:    "#ec4899",
  red:     "#ef4444",
  orange:  "#f97316",
  yellow:  "#eab308",
  teal:    "#14b8a6",
  indigo:  "#6366f1",
  cyan:    "#06b6d4",
  rose:    "#f43f5e",
  amber:   "#f59e0b",
  lime:    "#84cc16",
  emerald: "#10b981",
  sky:     "#0ea5e9",
  violet:  "#8b5cf6",
  fuchsia: "#d946ef",
  slate:   "#64748b",
  zinc:    "#71717a",
  gray:    "#6b7280",
};

function resolveColor(colorName) {
  return COLOR_MAP[colorName] || "var(--accent)";
}

export default function GoalsView({ categories, entries, goals, onUpdateGoals }) {
  const { preferences } = usePreferences();
  const weekStartsOn = preferences.weekStart === "sunday" ? 0 : 1;
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState("");

  const weekStats = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn });
    const weekDates = Array.from({ length: 7 }, (_, i) =>
      addDays(start, i).toISOString().split("T")[0]
    );
    const weekEntries = entries.filter(e => weekDates.includes(e.date));
    const allLogs = weekEntries.flatMap(e => e.logs);
    const stats = {};
    categories.forEach(cat => {
      stats[cat.id] = allLogs
        .filter(l => l.categoryId === cat.id)
        .reduce((sum, l) => sum + (l.value || 0), 0);
    });
    return stats;
  }, [entries, categories, weekStartsOn]);

  const startEdit = (catId, currentGoal) => {
    setEditing(catId);
    setEditValue(String(currentGoal || 100));
  };

  const saveEdit = (catId) => {
    const val = Number(editValue);
    if (val > 0) onUpdateGoals({ [catId]: val });
    setEditing(null);
  };

  const clearGoal = (catId) => {
    onUpdateGoals({ [catId]: undefined });
  };

  return (
    <div className="space-y-4">
      {categories.filter(c => c.isActive).map((cat) => {
        const Icon = iconMap[cat.icon] || Circle;
        const target = goals.weekly?.[cat.id] || 0;
        const current = weekStats[cat.id] || 0;
        const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
        const pctDisplay = Math.round(pct);
        const hasGoal = target > 0;
        const isEditing = editing === cat.id;
        const color = resolveColor(cat.color);
        const displayCurrent = cat.unit === "hours" ? current.toFixed(1) : Math.round(current);

        return (
          <div
            key={cat.id}
            onClick={() => !isEditing && !hasGoal && startEdit(cat.id, 100)}
            className="group rounded-2xl border p-6 transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.98]"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--surface2)"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "var(--surface)"; }}
          >
            {/* ── Top row ── */}
            <div className="flex items-center justify-between gap-4 mb-4">

              {/* Left: Icon + Name */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="p-2.5 rounded-xl flex-shrink-0"
                  style={{ backgroundColor: `${color}22` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <span
                  className="text-sm font-semibold truncate"
                  style={{ color: "var(--text)" }}
                >
                  {cat.name}
                </span>
              </div>

              {/* Right: progress text / edit state / empty prompt */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isEditing ? (
                  <div
                    className="flex items-center gap-1.5"
                    onClick={e => e.stopPropagation()}
                  >
                    <Input
                      type="number"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="w-20 h-7 text-xs px-2"
                      style={{
                        backgroundColor: "var(--bg)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === "Enter") saveEdit(cat.id);
                        if (e.key === "Escape") setEditing(null);
                      }}
                    />
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{cat.unit}</span>
                    <button
                      onClick={() => saveEdit(cat.id)}
                      className="text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="hover:text-red-400 transition-colors"
                      style={{ color: "var(--muted)" }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : hasGoal ? (
                  <div
                    className="flex items-center gap-2"
                    onClick={e => { e.stopPropagation(); startEdit(cat.id, target); }}
                  >
                    <span className="text-sm tabular-nums" style={{ color: "var(--muted)" }}>
                      <span style={{ color: "var(--text)", fontWeight: 600 }}>
                        {displayCurrent}
                      </span>
                      {" / "}{target}
                      <span className="text-xs ml-1">{cat.unit}</span>
                    </span>
                    <span
                      className="text-xs font-bold tabular-nums min-w-[2.5rem] text-right"
                      style={{ color }}
                    >
                      {pctDisplay}%
                    </span>
                    <Edit2
                      className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity"
                      style={{ color: "var(--muted)" }}
                    />
                    <button
                      onClick={e => { e.stopPropagation(); clearGoal(cat.id); }}
                      className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity"
                      style={{ color: "var(--muted)" }}
                      title="Clear goal"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--accent)" }}
                  >
                    Tap to set goal
                  </span>
                )}
              </div>
            </div>

            {/* ── Progress bar ── */}
            {hasGoal && !isEditing && (
              <AnimatedBar pct={pct} color={color} />
            )}
          </div>
        );
      })}
    </div>
  );
}