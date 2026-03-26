import React, { useState, useEffect, useRef } from "react";
import { X, Command, Plus, Check } from "lucide-react";
import { useToast } from "./Toast";

export default function CommandPalette({ isOpen, onClose, categories, onAddLog, onAddCategory, currentDate }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [parsed, setParsed] = useState(null);
  const [creating, setCreating] = useState(null);
  const inputRef = useRef(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!input.trim()) {
      setParsed(null);
      setError("");
      setCreating(null);
      return;
    }

    const result = parseCommand(input, categories, currentDate);
    if (result.error) {
      setError(result.error);
      setParsed(null);
      setCreating(result.creating || null);
    } else {
      setError("");
      setParsed(result);
      setCreating(null);
    }
  }, [input, categories, currentDate]);

  const handleSubmit = () => {
    if (creating) {
      if (!creating.unit) {
        setError("Select a unit to create the category");
        return;
      }
      onAddCategory({ ...creating, color: "blue", icon: "Circle" });
      addToast(`Category "${creating.name}" created`, "success");
      setCreating(null);
      setInput("");
      return;
    }

    if (!parsed || error) return;

    onAddLog(parsed);
    addToast(`Logged: ${parsed.categoryName} ${parsed.value}`, "success");
    setInput("");
    setParsed(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 px-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[520px] rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xl)] animate-palette-in">
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
          <Command className="w-4 h-4 text-[var(--muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a log… (e.g., coding 60, gym 45, sleep 7.5)"
            className="flex-1 bg-transparent text-[var(--text)] outline-none text-sm placeholder:text-[var(--muted)]"
          />
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--text)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-sm text-[var(--danger)]">
              {error}
            </div>
          )}

          {creating && (
            <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)]">
              <div className="flex items-center gap-2 mb-3">
                <Plus className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-sm font-medium text-[var(--text)]">Create new category</span>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-[var(--muted)]">Name: {creating.name}</div>
                <div className="flex gap-2">
                  {["minutes", "hours", "pages", "count", "score"].map((unit) => (
                    <button
                      key={unit}
                      onClick={() => setCreating({ ...creating, unit })}
                      className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all ${
                        creating.unit === unit
                          ? "bg-[var(--accent)] text-white"
                          : "bg-[var(--bg)] text-[var(--muted)] border border-[var(--border)] hover:border-[var(--accent)]"
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!creating.unit}
                  className="w-full mt-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create & Continue
                </button>
              </div>
            </div>
          )}

          {parsed && (
            <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--accent)]/30 bg-[var(--accent)]/5">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-[var(--success)]" />
                <span className="text-sm font-medium text-[var(--text)]">Ready to log</span>
              </div>
              <div className="space-y-1 text-xs text-[var(--muted)]">
                <div><span className="font-medium text-[var(--text)]">{parsed.categoryName}</span> • {parsed.value} {parsed.unit}</div>
                {parsed.note && <div>Note: {parsed.note}</div>}
                <div>{parsed.date} at {parsed.time}</div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Examples</div>
            <div className="space-y-1 text-xs text-[var(--muted)]">
              <div><code className="px-1.5 py-0.5 rounded bg-[var(--bg)] text-[var(--text)]">coding 60</code> - Log 60 to category</div>
              <div><code className="px-1.5 py-0.5 rounded bg-[var(--bg)] text-[var(--text)]">gym 45; legs day</code> - Add a note</div>
              <div><code className="px-1.5 py-0.5 rounded bg-[var(--bg)] text-[var(--text)]">yesterday sleep 7.5</code> - Log to yesterday</div>
              <div><code className="px-1.5 py-0.5 rounded bg-[var(--bg)] text-[var(--text)]">2026-02-17@09:00 reading 30</code> - Specific date/time</div>
            </div>
          </div>

          <div className="text-xs text-[var(--muted)]">
            Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg)] text-[var(--text)] font-mono">Enter</kbd> to log • <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg)] text-[var(--text)] font-mono">Esc</kbd> to close
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes palette-in {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-palette-in {
          animation: palette-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

function parseCommand(input, categories, defaultDate) {
  const trimmed = input.trim();
  const parts = trimmed.split(/\s+/);

  let dateStr = defaultDate || new Date().toISOString().split("T")[0];
  let timeStr = new Date().toTimeString().slice(0, 5);
  let startIdx = 0;

  if (parts[0].toLowerCase() === "yesterday") {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    dateStr = yesterday.toISOString().split("T")[0];
    startIdx = 1;
  } else if (parts[0].toLowerCase() === "today") {
    startIdx = 1;
  } else if (/^\d{4}-\d{2}-\d{2}/.test(parts[0])) {
    const [datePart, timePart] = parts[0].split("@");
    dateStr = datePart;
    if (timePart) timeStr = timePart;
    startIdx = 1;
  }

  if (parts.length - startIdx < 2) {
    return { error: "Format: <category> <value> [; note]" };
  }

  const fullText = parts.slice(startIdx).join(" ");
  const [mainPart, ...noteParts] = fullText.split(";");
  const note = noteParts.join(";").trim();

  const mainParts = mainPart.trim().split(/\s+/);
  if (mainParts.length < 2) {
    return { error: "Format: <category> <value>" };
  }

  const valueStr = mainParts[mainParts.length - 1];
  const categoryInput = mainParts.slice(0, -1).join(" ");

  const value = parseFloat(valueStr);
  if (isNaN(value) || value <= 0) {
    return { error: "Value must be a positive number" };
  }

  const matches = categories.filter(c => 
    c.isActive && c.name.toLowerCase().startsWith(categoryInput.toLowerCase())
  );

  if (matches.length === 0) {
    const exactMatch = categories.find(c => 
      c.isActive && c.name.toLowerCase() === categoryInput.toLowerCase()
    );
    if (exactMatch) {
      return validateAndBuild(exactMatch, value, dateStr, timeStr, note);
    }
    return { 
      error: `Category "${categoryInput}" not found. Select a unit to create it.`,
      creating: { name: categoryInput, unit: null }
    };
  }

  if (matches.length > 1) {
    const exactMatch = matches.find(c => c.name.toLowerCase() === categoryInput.toLowerCase());
    if (exactMatch) {
      return validateAndBuild(exactMatch, value, dateStr, timeStr, note);
    }
    return { error: `Ambiguous: ${matches.map(c => c.name).join(", ")}. Be more specific.` };
  }

  return validateAndBuild(matches[0], value, dateStr, timeStr, note);
}

function validateAndBuild(category, value, date, time, note) {
  if (category.unit === "score" && (value < 1 || value > 10)) {
    return { error: "Score must be between 1 and 10" };
  }

  return {
    categoryId: category.id,
    categoryName: category.name,
    unit: category.unit,
    value,
    date,
    time,
    note: note || "",
  };
}