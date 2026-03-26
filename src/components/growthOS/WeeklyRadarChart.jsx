import React, { useMemo } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from "recharts";

/**
 * Normalizes weekly totals against weekly goals.
 * Returns [{subject, A, fullMark: 100}, ...]
 */
function buildRadarData(categories, weekTotals, goals) {
  const weeklyGoals = goals?.weekly || {};

  return categories
    .filter(c => c.isActive)
    .map(cat => {
      const total = weekTotals[cat.id] || 0;
      const goal = weeklyGoals[cat.id];
      const pct = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : (total > 0 ? 50 : 0);
      return { subject: cat.name, A: pct, fullMark: 100 };
    });
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { subject, A } = payload[0]?.payload || {};
  return (
    <div
      className="px-3 py-2 rounded-lg border text-sm font-medium"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
    >
      {subject}: <span style={{ color: "var(--accent)" }}>{A}%</span>
    </div>
  );
};

export default function WeeklyRadarChart({ categories, weekTotals, goals }) {
  const data = useMemo(
    () => buildRadarData(categories, weekTotals, goals),
    [categories, weekTotals, goals]
  );

  if (data.length < 3) return null; // Radar needs ≥3 axes to look meaningful

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "var(--muted)", fontSize: 11, fontWeight: 500 }}
        />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          name="Progress"
          dataKey="A"
          stroke="var(--accent)"
          fill="var(--accent)"
          fillOpacity={0.25}
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--accent)", strokeWidth: 0 }}
        />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}