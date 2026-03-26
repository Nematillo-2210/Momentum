import { useState, useEffect, useCallback } from "react";
import { saveEncrypted, loadDecrypted } from "./storage";

const CURRENT_VERSION = 2;

const getDefaultCategories = () => [
  { id: "study", name: "Study", unit: "minutes", color: "blue", icon: "BookOpen", isActive: true, createdAt: new Date().toISOString() },
  { id: "gym", name: "Gym", unit: "minutes", color: "emerald", icon: "Dumbbell", isActive: true, createdAt: new Date().toISOString() },
  { id: "sleep", name: "Sleep", unit: "hours", color: "violet", icon: "Moon", isActive: true, createdAt: new Date().toISOString() },
  { id: "reading", name: "Reading", unit: "pages", color: "amber", icon: "FileText", isActive: true, createdAt: new Date().toISOString() },
];

const getDefaultData = () => ({
  version: CURRENT_VERSION,
  categories: getDefaultCategories(),
  entries: [],
  goals: { weekly: {} },
  weeklyNotes: {},
});

const migrateData = (parsed) => {
  // v1 -> v2: Convert flat entries to entries with nested logs
  if (!parsed.version || parsed.version < 2) {
    const oldEntries = parsed.entries || [];
    const entryMap = {};
    
    oldEntries.forEach(entry => {
      const key = `${entry.date}_${entry.time || "12:00"}`;
      if (!entryMap[key]) {
        entryMap[key] = {
          id: entry.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
          date: entry.date || new Date().toISOString().split("T")[0],
          time: entry.time || "12:00",
          logs: []
        };
      }
      entryMap[key].logs.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        categoryId: entry.categoryId || entry.type || "study",
        value: entry.value || entry.minutes || entry.hours || entry.pages || entry.duration || 0,
        note: entry.note || entry.subject || entry.gym_type || ""
      });
    });
    
    parsed.entries = Object.values(entryMap);
    
    // Migrate categories if missing or using old format
    if (!parsed.categories || parsed.categories.length === 0) {
      parsed.categories = getDefaultCategories();
    } else {
      parsed.categories = parsed.categories.map(cat => ({
        ...cat,
        unit: cat.unit || cat.type || "minutes",
        isActive: cat.isActive !== undefined ? cat.isActive : true,
        createdAt: cat.createdAt || new Date().toISOString()
      }));
    }
    
    // Migrate goals to nested structure
    if (parsed.goals && !parsed.goals.weekly) {
      parsed.goals = { weekly: parsed.goals };
    }
    
    parsed.version = CURRENT_VERSION;
  }
  
  return parsed;
};

const loadData = () => {
  try {
    const parsed = loadDecrypted();
    if (parsed) {
      const migrated = migrateData(parsed);
      return { ...getDefaultData(), ...migrated };
    }
  } catch (e) {
    console.error("Failed to load data", e);
  }
  return getDefaultData();
};

const saveData = (data) => {
  saveEncrypted(data);
};

export default function useGrowthData() {
  const [data, setData] = useState(() => loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const addLog = useCallback((log) => {
    const entryKey = `${log.date}_${log.time}`;
    setData((prev) => {
      const existing = prev.entries.find(e => `${e.date}_${e.time}` === entryKey);
      if (existing) {
        return {
          ...prev,
          entries: prev.entries.map(e => 
            e.id === existing.id 
              ? { ...e, logs: [...e.logs, { 
                  id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
                  ...log
                }] }
              : e
          )
        };
      } else {
        return {
          ...prev,
          entries: [...prev.entries, {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            date: log.date,
            time: log.time,
            logs: [{
              id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
              categoryId: log.categoryId,
              value: log.value,
              note: log.note || ""
            }]
          }]
        };
      }
    });
  }, []);

  const updateLog = useCallback((entryId, logId, updates) => {
    setData((prev) => ({
      ...prev,
      entries: prev.entries.map(e =>
        e.id === entryId
          ? { ...e, logs: e.logs.map(l => l.id === logId ? { ...l, ...updates } : l) }
          : e
      )
    }));
  }, []);

  const deleteLog = useCallback((entryId, logId) => {
    setData((prev) => ({
      ...prev,
      entries: prev.entries.map(e =>
        e.id === entryId
          ? { ...e, logs: e.logs.filter(l => l.id !== logId) }
          : e
      ).filter(e => e.logs.length > 0)
    }));
  }, []);

  const updateGoals = useCallback((goals) => {
    setData((prev) => ({
      ...prev,
      goals: { ...prev.goals, weekly: { ...prev.goals.weekly, ...goals } }
    }));
  }, []);

  const clearAll = useCallback(() => {
    setData(getDefaultData());
  }, []);

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `growthOS_backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const importData = useCallback((jsonString) => {
    const parsed = JSON.parse(jsonString);
    const migrated = migrateData(parsed);
    setData({ ...getDefaultData(), ...migrated });
  }, []);

  const saveWeeklyNote = useCallback((weekStart, note) => {
    setData((prev) => ({
      ...prev,
      weeklyNotes: { ...prev.weeklyNotes, [weekStart]: note },
    }));
  }, []);

  const getWeeklyNote = useCallback((weekStart) => {
    return data.weeklyNotes?.[weekStart] || "";
  }, [data.weeklyNotes]);

  const addCategory = useCallback((category) => {
    const newCat = {
      ...category,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      isActive: true,
      createdAt: new Date().toISOString()
    };
    setData((prev) => ({ ...prev, categories: [...prev.categories, newCat] }));
  }, []);

  const updateCategory = useCallback((id, updates) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  }, []);

  const deleteCategory = useCallback((id, reassignTo = null) => {
    setData((prev) => {
      let newEntries = prev.entries;
      if (reassignTo) {
        newEntries = prev.entries.map(e => ({
          ...e,
          logs: e.logs.map(l => l.categoryId === id ? { ...l, categoryId: reassignTo } : l)
        }));
      } else {
        newEntries = prev.entries.map(e => ({
          ...e,
          logs: e.logs.filter(l => l.categoryId !== id)
        })).filter(e => e.logs.length > 0);
      }
      
      const newGoals = { ...prev.goals };
      if (newGoals.weekly) {
        delete newGoals.weekly[id];
      }
      
      return {
        ...prev,
        categories: prev.categories.filter(c => c.id !== id),
        entries: newEntries,
        goals: newGoals
      };
    });
  }, []);

  const getWeekEntries = useCallback((weekStart) => {
    const start = new Date(weekStart);
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d.toISOString().split("T")[0];
    });
    return data.entries.filter((e) => dates.includes(e.date));
  }, [data.entries]);

  const getStreak = useCallback((categoryId) => {
    const dates = [...new Set(
      data.entries.filter((e) => e.logs.some(l => l.categoryId === categoryId)).map((e) => e.date)
    )].sort().reverse();

    if (dates.length === 0) return 0;

    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    let expected = dates[0];
    for (const d of dates) {
      if (d === expected) {
        streak++;
        const prev = new Date(expected);
        prev.setDate(prev.getDate() - 1);
        expected = prev.toISOString().split("T")[0];
      } else {
        break;
      }
    }
    return streak;
  }, [data.entries]);

  return {
    data,
    categories: data.categories,
    activeCategories: data.categories.filter(c => c.isActive),
    addLog,
    updateLog,
    deleteLog,
    updateGoals,
    clearAll,
    exportData,
    importData,
    saveWeeklyNote,
    getWeeklyNote,
    addCategory,
    updateCategory,
    deleteCategory,
    getWeekEntries,
    getStreak,
    updateData: (newData) => {
      setData(newData);
      saveData(newData);
    },
  };
}