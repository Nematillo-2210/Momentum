import React from "react";
import { useTheme } from "./useTheme";
import { Check } from "lucide-react";

export default function ThemeSelector() {
  const { currentTheme, setTheme, themes } = useTheme();

  return (
    <div
      className="rounded-[var(--radius)] border p-5"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>
        Theme
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {Object.entries(themes).map(([key, t]) => {
          const isActive = currentTheme === key;
          const c = t.colors;
          return (
            <button
              key={key}
              onClick={() => setTheme(key)}
              style={{
                borderColor: isActive ? c.accent : "var(--border)",
                backgroundColor: isActive ? "var(--surface2)" : "var(--bg)",
              }}
              className="relative p-3 rounded-[var(--radius)] border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left"
            >
              {/* Preview swatch */}
              <div
                className="w-full h-12 rounded-lg mb-2 overflow-hidden relative"
                style={{ backgroundColor: c.bg, border: `1px solid ${c.border}` }}
              >
                <div className="absolute bottom-0 left-0 right-0 h-5 flex items-center px-2 gap-1.5"
                  style={{ backgroundColor: c.surface }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.accent }} />
                  <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: c.border }} />
                </div>
                <div className="absolute top-2 left-2 space-y-1">
                  <div className="w-8 h-1.5 rounded-full" style={{ backgroundColor: c.text, opacity: 0.75 }} />
                  <div className="w-5 h-1 rounded-full" style={{ backgroundColor: c.muted, opacity: 0.45 }} />
                </div>
                <div className="absolute top-2 right-2 w-3 h-3 rounded-full" style={{ backgroundColor: c.accent }} />
              </div>

              <div className="text-xs font-medium" style={{ color: "var(--text)" }}>{t.name}</div>

              {isActive && (
                <div
                  className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: c.accent }}
                >
                  <Check className="w-2.5 h-2.5" style={{ color: c.bg }} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}