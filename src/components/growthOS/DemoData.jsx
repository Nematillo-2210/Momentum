/**
 * Generates a realistic 30-day demo dataset for Momentum.
 * Returns a full data object ready to be passed to onDataUpdate().
 */

const CURRENT_VERSION = 2;

function randId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function dateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function buildDemoData() {
  const categories = [
    { id: "study",   name: "Study",   unit: "minutes", color: "blue",   icon: "BookOpen",  isActive: true, createdAt: new Date().toISOString() },
    { id: "gym",     name: "Gym",     unit: "minutes", color: "emerald",icon: "Dumbbell",  isActive: true, createdAt: new Date().toISOString() },
    { id: "reading", name: "Reading", unit: "pages",   color: "amber",  icon: "FileText",  isActive: true, createdAt: new Date().toISOString() },
    { id: "sleep",   name: "Sleep",   unit: "hours",   color: "violet", icon: "Moon",      isActive: true, createdAt: new Date().toISOString() },
  ];

  const entries = [];

  // Patterns: 4-6 days/week active, varied intensity
  for (let day = 0; day < 30; day++) {
    const date = dateStr(day);
    // Skip ~25% of days to create realistic gaps
    if (Math.random() < 0.22) continue;

    const dayEntries = [];

    // Study: 30-120 min, most days
    if (Math.random() > 0.25) {
      const studyMins = pick([30, 45, 60, 75, 90, 120]);
      dayEntries.push({
        id: randId(),
        date,
        time: "09:00",
        logs: [{
          id: randId(),
          categoryId: "study",
          value: studyMins,
          note: pick(["Deep focus", "Revision", "Project work", "New topic", "Practice problems", ""]),
        }],
      });
    }

    // Gym: 3-4x/week, varied sessions
    if (Math.random() > 0.45) {
      const gymMins = pick([30, 45, 60, 75]);
      dayEntries.push({
        id: randId(),
        date,
        time: "07:00",
        logs: [{
          id: randId(),
          categoryId: "gym",
          value: gymMins,
          note: pick(["Push day", "Pull day", "Legs", "Cardio", "Full body", ""]),
        }],
      });
    }

    // Reading: pages per session
    if (Math.random() > 0.4) {
      const pages = pick([10, 15, 20, 25, 30, 35, 40]);
      dayEntries.push({
        id: randId(),
        date,
        time: "21:00",
        logs: [{
          id: randId(),
          categoryId: "reading",
          value: pages,
          note: pick(["Atomic Habits", "Deep Work", "Fiction", "Non-fiction", ""]),
        }],
      });
    }

    // Sleep: nightly
    if (Math.random() > 0.15) {
      const hrs = pick([6, 6.5, 7, 7.5, 8, 8.5]);
      dayEntries.push({
        id: randId(),
        date,
        time: "23:30",
        logs: [{
          id: randId(),
          categoryId: "sleep",
          value: hrs,
          note: "",
        }],
      });
    }

    entries.push(...dayEntries);
  }

  return {
    version: CURRENT_VERSION,
    categories,
    entries,
    goals: {
      weekly: {
        study:   300,
        gym:     150,
        reading: 80,
        sleep:   49,
      },
    },
    weeklyNotes: {},
  };
}