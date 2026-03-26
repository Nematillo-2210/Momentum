import React, { useState, useRef, useEffect, useCallback } from "react";
import { Clock, ChevronDown } from "lucide-react";

const ITEM_H = 40; // px per item

function parseTime(time24h) {
  if (!time24h) {
    const now = new Date();
    const h = now.getHours();
    return { hour: h === 0 ? 12 : h > 12 ? h - 12 : h, minute: now.getMinutes(), period: h >= 12 ? "PM" : "AM" };
  }
  const [hs, ms] = time24h.split(":");
  const h = parseInt(hs, 10);
  return { hour: h === 0 ? 12 : h > 12 ? h - 12 : h, minute: parseInt(ms, 10), period: h >= 12 ? "PM" : "AM" };
}

function formatTo24h({ hour, minute, period }) {
  let h = hour;
  if (period === "AM" && hour === 12) h = 0;
  else if (period === "PM" && hour !== 12) h = hour + 12;
  return `${h.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

/** A single scroll-snap column */
function ScrollColumn({ items, selected, onSelect, label }) {
  const ref = useRef(null);
  const isScrolling = useRef(false);

  // Scroll to selected item on mount / change
  useEffect(() => {
    if (!ref.current || isScrolling.current) return;
    const idx = items.indexOf(selected);
    if (idx < 0) return;
    ref.current.scrollTop = idx * ITEM_H;
  }, [selected, items]);

  const handleScroll = useCallback(() => {
    if (!ref.current) return;
    isScrolling.current = true;
    clearTimeout(ref.current._scrollTimer);
    ref.current._scrollTimer = setTimeout(() => {
      if (!ref.current) return;
      const idx = Math.round(ref.current.scrollTop / ITEM_H);
      const snapped = items[Math.max(0, Math.min(idx, items.length - 1))];
      if (snapped !== selected) onSelect(snapped);
      isScrolling.current = false;
    }, 120);
  }, [items, onSelect, selected]);

  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className="text-[10px] font-semibold uppercase tracking-widest mb-1"
        style={{ color: "var(--muted)" }}>{label}</div>

      {/* mask wrapper */}
      <div
        className="relative w-full"
        style={{
          maskImage: "linear-gradient(to bottom, transparent, black 22%, black 78%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 22%, black 78%, transparent)",
        }}
      >
        {/* highlight bar */}
        <div
          className="absolute left-0 right-0 pointer-events-none rounded-lg z-10"
          style={{
            top: `calc(50% - ${ITEM_H / 2}px)`,
            height: ITEM_H,
            backgroundColor: "var(--surface2)",
            border: "1px solid var(--border)",
          }}
        />

        <div
          ref={ref}
          onScroll={handleScroll}
          className="flex flex-col items-center overflow-y-auto relative z-20"
          style={{
            height: ITEM_H * 5,
            scrollSnapType: "y mandatory",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {/* padding sentinel top */}
          <div style={{ height: ITEM_H * 2, flexShrink: 0 }} />

          {items.map((item) => {
            const isActive = item === selected;
            return (
              <div
                key={item}
                onClick={() => {
                  onSelect(item);
                  if (ref.current) {
                    const idx = items.indexOf(item);
                    ref.current.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
                  }
                }}
                style={{
                  height: ITEM_H,
                  flexShrink: 0,
                  scrollSnapAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontWeight: isActive ? 700 : 400,
                  fontSize: isActive ? 18 : 15,
                  color: isActive ? "var(--text)" : "var(--muted)",
                  transition: "color 0.15s, font-size 0.15s, font-weight 0.15s",
                  userSelect: "none",
                  width: "100%",
                }}
              >
                {typeof item === "number" ? item.toString().padStart(2, "0") : item}
              </div>
            );
          })}

          {/* padding sentinel bottom */}
          <div style={{ height: ITEM_H * 2, flexShrink: 0 }} />
        </div>
      </div>
    </div>
  );
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ["AM", "PM"];

export default function TimePicker({ value, onChange, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(() => parseTime(value));
  const containerRef = useRef(null);

  useEffect(() => { setSelected(parseTime(value)); }, [value]);

  useEffect(() => {
    if (!isOpen) return;
    const close = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    const esc = (e) => { if (e.key === "Escape") setIsOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [isOpen]);

  const handleSelect = (type, val) => {
    const next = { ...selected, [type]: val };
    setSelected(next);
    onChange(formatTo24h(next));
  };

  const displayTime = `${selected.hour.toString().padStart(2, "0")}:${selected.minute.toString().padStart(2, "0")} ${selected.period}`;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] border text-sm transition-all"
        style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
      >
        <Clock className="w-4 h-4" style={{ color: "var(--muted)" }} />
        <span className="flex-1 text-left">{displayTime}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          style={{ color: "var(--muted)" }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 z-50 w-full min-w-[240px] rounded-[var(--radius-lg)] border shadow-xl"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
            animation: "popoverIn 0.15s ease-out",
          }}
        >
          <div className="flex items-stretch gap-0 px-3 py-4">
            <ScrollColumn
              items={HOURS}
              selected={selected.hour}
              onSelect={(v) => handleSelect("hour", v)}
              label="Hr"
            />

            <div className="flex items-center justify-center text-xl font-bold pb-1"
              style={{ color: "var(--muted)", width: 16 }}>:</div>

            <ScrollColumn
              items={MINUTES}
              selected={selected.minute}
              onSelect={(v) => handleSelect("minute", v)}
              label="Min"
            />

            <div style={{ width: 8 }} />

            <ScrollColumn
              items={PERIODS}
              selected={selected.period}
              onSelect={(v) => handleSelect("period", v)}
              label="AM/PM"
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes popoverIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}