import React, { useEffect, useRef, useState } from "react";

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getLabel(score) {
  if (score < 30) return "Warming up...";
  if (score <= 80) return "Building momentum.";
  return "Peak Output.";
}

export default function ScoreRing({ score }) {
  const [displayed, setDisplayed] = useState(0);
  const [animated, setAnimated] = useState(0);
  const rafRef = useRef(null);

  // Animate number ticker
  useEffect(() => {
    const duration = 1500;
    const start = performance.now();
    const from = 0;

    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(from + (score - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [score]);

  // Animate ring after a tiny paint delay
  useEffect(() => {
    const id = setTimeout(() => setAnimated(score), 50);
    return () => clearTimeout(id);
  }, [score]);

  const strokeDashoffset = CIRCUMFERENCE - (animated / 100) * CIRCUMFERENCE;

  return (
    <div
      className="rounded-[var(--radius)] border border-[var(--border)] p-6 flex flex-col items-center gap-4"
      style={{ backgroundColor: "var(--surface)", boxShadow: "var(--shadow-md)" }}
    >
      <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
        Daily Score
      </div>

      {/* SVG Ring */}
      <div className="relative flex items-center justify-center">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Track */}
          <circle
            cx="70" cy="70" r={RADIUS}
            fill="none"
            stroke="var(--surface2)"
            strokeWidth="10"
          />
          {/* Progress */}
          <circle
            cx="70" cy="70" r={RADIUS}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 70 70)"
            style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)" }}
          />
        </svg>

        {/* Center number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-5xl font-bold tabular-nums leading-none"
            style={{ color: "var(--text)" }}
          >
            {displayed}
          </span>
          <span className="text-xs mt-1" style={{ color: "var(--muted)" }}>/100</span>
        </div>
      </div>

      {/* Sub-label */}
      <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>
        {getLabel(score)}
      </p>
    </div>
  );
}