import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, ChevronLeft, ChevronRight, Pencil, Check, X, Command, BookOpen, Dumbbell, Moon, FileText, Coffee, Music, Briefcase, Heart, Zap, Target, Activity, Award, TrendingUp, Users, Circle, Sparkles } from "lucide-react";
import { format, addDays } from "date-fns";
import TimePicker from "./TimePicker";
import ScoreRing from "./ScoreRing";
/** Brutal Coach score: hard to hit 100, max 30 with no goals met */
function calculateDailyScore({ todayLogs, yesterdayLogs, goals }) {
  const weeklyGoals = goals?.weekly || {};
  const hasGoals = Object.keys(weeklyGoals).length > 0;

  // Goal completion component (0–70)
  let goalScore = 0;
  if (hasGoals) {
    const catTotals = {};
    todayLogs.forEach(l => {
      catTotals[l.categoryId] = (catTotals[l.categoryId] || 0) + (l.value || 0);
    });
    const goalEntries = Object.entries(weeklyGoals).filter(([, g]) => g > 0);
    if (goalEntries.length > 0) {
      const dailyTarget = 1 / 7; // daily share of weekly goal
      const pcts = goalEntries.map(([id, weekly]) => {
        const daily = weekly * dailyTarget;
        return Math.min(1, (catTotals[id] || 0) / daily);
      });
      const avgPct = pcts.reduce((s, p) => s + p, 0) / pcts.length;
      goalScore = avgPct * 70;
    }
  }

  // Streak/consistency bonus (0–20): did they log yesterday?
  const streakScore = yesterdayLogs.length > 0 ? 20 : 0;

  // Log count component (0–10): max at 8+ logs
  const logScore = Math.min(10, (todayLogs.length / 8) * 10);

  const raw = goalScore + streakScore + logScore;

  // If no goals met at all, cap at 30
  if (!hasGoals || goalScore === 0) {
    return Math.min(30, Math.round(streakScore + logScore));
  }

  return Math.min(100, Math.round(raw));
}

const iconMap = { BookOpen, Dumbbell, Moon, FileText, Coffee, Music, Briefcase, Heart, Zap, Target, Activity, Award, TrendingUp, Users, Circle };

function LogForm({ categories, onAdd, date }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));

  const selectedCategory = categories.find(c => c.id === categoryId);

  const handleSubmit = () => {
    if (!categoryId || !value) return;
    const numValue = Number(value);
    if (selectedCategory?.unit === "score" && (numValue < 1 || numValue > 10)) {
      return;
    }
    onAdd({
      date,
      time,
      categoryId,
      value: numValue,
      note,
    });
    setValue("");
    setNote("");
    setTime(new Date().toTimeString().slice(0, 5));
  };

  const getPlaceholder = () => {
    if (!selectedCategory) return "Value";
    if (selectedCategory.unit === "score") return "1-10";
    return selectedCategory.unit;
  };

  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 shadow-[var(--shadow-lg)] backdrop-blur-xl transition-all duration-[var(--transition-base)]">
      <div className="flex gap-2">
        <TimePicker
          value={time}
          onChange={setTime}
          className="w-36"
        />
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white flex-1">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          placeholder={getPlaceholder()}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="bg-[var(--surface2)] border-[var(--border)] text-[var(--text)] w-24 focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all duration-[var(--transition-fast)]"
          step={selectedCategory?.unit === "hours" ? "0.5" : "1"}
          min={selectedCategory?.unit === "score" ? "1" : undefined}
          max={selectedCategory?.unit === "score" ? "10" : undefined}
        />
      </div>
      <Input
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="bg-[var(--surface2)] border-[var(--border)] text-[var(--text)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all duration-[var(--transition-fast)]"
      />
      <Button onClick={handleSubmit} className="w-full font-semibold h-11 rounded-[var(--radius-lg)] transition-all duration-200 active:scale-[0.97]" style={{ backgroundColor: "var(--accent)", color: "var(--primary-foreground)" }}>
        <Plus className="w-4 h-4 mr-1.5" />
        Log Entry
      </Button>
    </div>
  );
}

function LogItem({ log, category, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(log.value);
  const [note, setNote] = useState(log.note);

  const Icon = iconMap[category?.icon] || Circle;
  const color = category?.color || "zinc";

  const handleSave = () => {
    onUpdate({ value: Number(value), note });
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-3 py-3 px-4 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--border)] group hover:border-[var(--muted)] hover:shadow-[var(--shadow-md)] transition-all duration-[var(--transition-base)]">
      <div className={`p-2 rounded-lg border bg-${color}-500/15 text-${color}-400 border-${color}-500/20`}>
        <Icon className="w-4 h-4" />
      </div>
      {editing ? (
        <div className="flex-1 flex gap-2">
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="bg-[var(--surface2)] border-[var(--border)] text-[var(--text)] h-8 w-20 text-sm focus:ring-2 focus:ring-[var(--accent)]/20"
          />
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="bg-[var(--surface2)] border-[var(--border)] text-[var(--text)] h-8 flex-1 text-sm focus:ring-2 focus:ring-[var(--accent)]/20"
            placeholder="Note"
          />
        </div>
      ) : (
        <div className="flex-1 min-w-0">
          <div className="text-sm text-[var(--text)] font-medium">{category?.name || "Unknown"}</div>
          <div className="text-xs text-[var(--muted)]">
            {log.value} {category?.unit}
            {log.note && ` · ${log.note}`}
          </div>
        </div>
      )}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
        {editing ? (
          <>
            <button
              onClick={handleSave}
              className="p-1.5 rounded-[var(--radius-md)] text-[var(--success)] hover:bg-[var(--success)]/10 transition-colors duration-[var(--transition-fast)]"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setEditing(false)}
              className="p-1.5 rounded-[var(--radius-md)] text-[var(--muted)] hover:bg-[var(--surface2)] transition-colors duration-[var(--transition-fast)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-[var(--radius-md)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-colors duration-[var(--transition-fast)]"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-[var(--radius-md)] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors duration-[var(--transition-fast)]"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function TodayView({ categories, entries, onAdd, onUpdate, onDelete, onOpenPalette, onDateChange, goals }) {
  const [viewDate, setViewDate] = useState(new Date().toISOString().split("T")[0]);
  const activeCategories = categories.filter(c => c.isActive);

  useEffect(() => {
    if (onDateChange) onDateChange(viewDate);
  }, [viewDate, onDateChange]);
  
  const yesterday = addDays(new Date(viewDate), -1).toISOString().split("T")[0];

  const dayEntries = entries.filter((e) => e.date === viewDate);
  const allLogs = dayEntries.flatMap(entry => 
    entry.logs.map(log => ({
      ...log,
      entryId: entry.id,
      time: entry.time
    }))
  ).sort((a, b) => a.time.localeCompare(b.time));

  const yesterdayLogs = entries
    .filter(e => e.date === yesterday)
    .flatMap(e => e.logs);

  const score = useMemo(() => calculateDailyScore({
    todayLogs: allLogs,
    yesterdayLogs,
    goals,
  }), [allLogs, yesterdayLogs, goals]);

  const groupedLogs = {};
  allLogs.forEach(log => {
    if (!groupedLogs[log.categoryId]) {
      groupedLogs[log.categoryId] = [];
    }
    groupedLogs[log.categoryId].push(log);
  });

  const goToPrevDay = () => setViewDate(addDays(new Date(viewDate), -1).toISOString().split("T")[0]);
  const goToNextDay = () => setViewDate(addDays(new Date(viewDate), 1).toISOString().split("T")[0]);
  const goToToday = () => setViewDate(new Date().toISOString().split("T")[0]);
  const isToday = viewDate === new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <ScoreRing key={viewDate} score={score} />
      <LogForm categories={activeCategories} onAdd={onAdd} date={viewDate} />
      
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">
            {format(new Date(viewDate), "EEEE, MMM d")}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPalette}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] transition-all border border-[var(--border)]"
            >
              <Command className="w-3.5 h-3.5" />
              Quick Log
            </button>
          <div className="flex items-center gap-1">
            <button onClick={goToPrevDay} className="p-1.5 rounded-[var(--radius-md)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-all duration-[var(--transition-fast)]">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {!isToday && (
              <button onClick={goToToday} className="px-2 py-1 text-xs rounded-[var(--radius-md)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-all duration-[var(--transition-fast)] font-medium">
                Today
              </button>
            )}
            <button onClick={goToNextDay} className="p-1.5 rounded-[var(--radius-md)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-all duration-[var(--transition-fast)]">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          </div>
        </div>
        
        {allLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Sparkles className="w-8 h-8" style={{ color: "var(--muted)", opacity: 0.5 }} />
            <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>No momentum yet today. Start small.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedLogs).map(([catId, logs]) => {
              const cat = categories.find(c => c.id === catId);
              return (
                <div key={catId} className="space-y-2">
                  <div className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider px-1">
                    {cat?.name}
                  </div>
                  {logs.map((log) => (
                    <LogItem
                      key={log.id}
                      log={log}
                      category={cat}
                      onUpdate={(updates) => onUpdate(log.entryId, log.id, updates)}
                      onDelete={() => onDelete(log.entryId, log.id)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}