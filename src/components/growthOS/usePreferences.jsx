import { useState, useEffect } from "react";

const DEFAULT_PREFERENCES = {
  defaultTab: "today",
  weekStart: "monday", // "monday" or "sunday"
  density: "comfortable", // "compact" or "comfortable"
  confirmDelete: true,
  confirmReset: true,
};

export function usePreferences() {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  useEffect(() => {
    const stored = localStorage.getItem("growthOS_preferences");
    if (stored) {
      try {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
      } catch (e) {
        console.error("Failed to load preferences", e);
      }
    }
  }, []);

  const updatePreference = (key, value) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem("growthOS_preferences", JSON.stringify(updated));
  };

  return { preferences, updatePreference };
}