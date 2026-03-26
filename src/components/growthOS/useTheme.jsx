import { useState, useEffect } from "react";

const themes = {
  linearMidnight: {
    name: "Linear Midnight",
    mode: "dark",
    colors: {
      bg:        "#0C0D0F",
      surface:   "#141518",
      surface2:  "#1E1F24",
      border:    "#2C2D33",
      text:      "#F3F4F6",
      muted:     "#8B8D98",
      accent:    "#5E6AD2",
      danger:    "#E11D48",
    },
  },
  supabaseDark: {
    name: "Supabase Dark",
    mode: "dark",
    colors: {
      bg:        "#111312",
      surface:   "#171918",
      surface2:  "#232524",
      border:    "#2E3130",
      text:      "#EDEDED",
      muted:     "#8B908F",
      accent:    "#24B47E",
      danger:    "#EF4444",
    },
  },
  cobalt: {
    name: "Cobalt",
    mode: "dark",
    colors: {
      bg:        "#0B0E14",
      surface:   "#151921",
      surface2:  "#21262E",
      border:    "#2B323D",
      text:      "#F1F5F9",
      muted:     "#7B8EA8",
      accent:    "#3B82F6",
      danger:    "#EF4444",
    },
  },
  titanium: {
    name: "Titanium",
    mode: "dark",
    colors: {
      bg:        "#09090B",
      surface:   "#18181B",
      surface2:  "#27272A",
      border:    "#3F3F46",
      text:      "#E4E4E7",
      muted:     "#71717A",
      accent:    "#FAFAFA",
      danger:    "#EF4444",
    },
  },
};

const DEFAULT_THEME = "linearMidnight";

const SHARED = {
  radius:      "14px",
  "shadow-sm": "0 1px 2px rgba(0,0,0,0.32)",
  "shadow-md": "0 8px 24px rgba(0,0,0,0.34)",
  transition:  "180ms ease",
};

function applyTheme(key) {
  const theme = themes[key];
  if (!theme) return;
  const root = document.documentElement;
  const c = theme.colors;

  Object.entries(c).forEach(([k, v]) => root.style.setProperty(`--${k}`, v));
  Object.entries(SHARED).forEach(([k, v]) => root.style.setProperty(`--${k}`, v));

  root.style.setProperty("--background",           c.bg);
  root.style.setProperty("--foreground",           c.text);
  root.style.setProperty("--card",                 c.surface);
  root.style.setProperty("--card-foreground",      c.text);
  root.style.setProperty("--popover",              c.surface);
  root.style.setProperty("--popover-foreground",   c.text);
  root.style.setProperty("--primary",              c.accent);
  // For light accents (e.g. Titanium white), foreground must be dark
  const isLightAccent = c.accent === "#FAFAFA" || c.accent === "#FFFFFF" || c.accent === "#F8FAFC";
  root.style.setProperty("--primary-foreground", isLightAccent ? "#09090B" : c.bg);
  root.style.setProperty("--secondary",            c.surface2);
  root.style.setProperty("--secondary-foreground", c.text);
  root.style.setProperty("--muted-foreground",     c.muted);
  root.style.setProperty("--accent-foreground",    c.text);
  root.style.setProperty("--destructive",          c.danger);
  root.style.setProperty("--destructive-foreground", c.text);
  root.style.setProperty("--input",                c.border);
  root.style.setProperty("--ring",                 c.accent);
}

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem("growthOS_theme");
    return (saved && themes[saved]) ? saved : DEFAULT_THEME;
  });

  useEffect(() => {
    applyTheme(currentTheme);
    localStorage.setItem("growthOS_theme", currentTheme);
  }, [currentTheme]);

  return {
    currentTheme,
    setTheme: setCurrentTheme,
    themes,
    themeColors: themes[currentTheme]?.colors ?? themes[DEFAULT_THEME].colors,
  };
}