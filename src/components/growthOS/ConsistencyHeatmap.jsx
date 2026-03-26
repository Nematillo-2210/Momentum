import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, subDays, getDay } from "date-fns";

function logToPoints(log, categories) {
  const cat = categories.find(c => c.id === log.categoryId);
  const value = log.value || 0;
  const unit = cat?.unit || "count";
  switch (unit) {
    case "minutes": return value;
    case "hours":   return value * 60;
    case "pages":   return value * 2;
    case "count":   return value * 10;
    case "score":   return value * 15;
    default:        return value;
  }
}

function getCellStyle(points, maxPoints) {
  if (points === 0 || maxPoints === 0) {
    return { backgroundColor: "var(--surface2)", opacity: 1 };
  }
  const ratio = points / maxPoints;
  let opacity;
  if (ratio <= 0.33)      opacity = 0.30;
  else if (ratio <= 0.66) opacity = 0.60;
  else                    opacity = 1.00;

  // Parse the accent color hex to use with rgba
  return { backgroundColor: "var(--accent)", opacity };
}

const DAY_LABELS = ["Mon", "Wed", "Fri"];
const DAY_LABEL_ROWS = [1, 3, 5]; // 0-indexed row positions (Mon=0, Tue=1...)

export default function ConsistencyHeatmap({ entries, categories }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build 90-day lookup
  const { days, maxPoints, weekColumns, monthLabels } = useMemo(() => {
    const days = [];
    for (let i = 89; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, "yyyy-MM-dd");
      const dayEntries = entries.filter(e => e.date === dateStr);
      const allLogs = dayEntries.flatMap(e => e.logs);
      const points = allLogs.reduce((sum, log) => sum + logToPoints(log, categories), 0);
      days.push({ date: d, dateStr, points });
    }

    const maxPoints = Math.max(...days.map(d => d.points), 1);

    // Arrange into week columns (Mon-start: day 0 = Monday, day 6 = Sunday)
    // getDay: 0=Sun,1=Mon...6=Sat → remap to Mon-start: Mon=0...Sun=6
    const toMonStart = (jsDay) => (jsDay + 6) % 7;

    // Pad the front so the first day falls on the correct row
    const firstDayRow = toMonStart(getDay(days[0].date));
    const padded = [
      ...Array(firstDayRow).fill(null),
      ...days,
    ];

    // Split into columns of 7
    const weekColumns = [];
    for (let i = 0; i < padded.length; i += 7) {
      weekColumns.push(padded.slice(i, i + 7));
    }

    // Month labels: for each column, if the first non-null day is the 1st of a new month
    // or if the column index === 0, record the month label.
    const monthLabels = {};
    let lastMonth = null;
    weekColumns.forEach((col, colIdx) => {
      const firstDay = col.find(d => d !== null);
      if (!firstDay) return;
      const month = format(firstDay.date, "MMM");
      if (month !== lastMonth) {
        monthLabels[colIdx] = month;
        lastMonth = month;
      }
    });

    return { days, maxPoints, weekColumns, monthLabels };
  }, [entries, categories]);

  const CELL = 12;
  const GAP = 4;
  const CELL_STEP = CELL + GAP;

  return (
    <Card className="bg-[var(--surface)] border-[var(--border)] shadow-[var(--shadow-sm)]">
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">
          90-Day Consistency
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <TooltipProvider delayDuration={120}>
          <ScrollArea className="w-full" type="scroll">
            <div style={{ paddingBottom: 8 }}>
              {/* Month labels row */}
              <div
                className="flex mb-1"
                style={{ gap: GAP }}
              >
                {weekColumns.map((_, colIdx) => (
                  <div
                    key={colIdx}
                    style={{ width: CELL, flexShrink: 0, fontSize: 10 }}
                    className="text-[var(--muted)] font-medium"
                  >
                    {monthLabels[colIdx] || ""}
                  </div>
                ))}
              </div>

              {/* Grid: rows = days of week, cols = weeks */}
              <div className="flex" style={{ gap: GAP }}>
                {/* Day-of-week labels */}
                <div
                  className="flex flex-col mr-1"
                  style={{ gap: GAP, marginTop: 0 }}
                >
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, i) => (
                    <div
                      key={i}
                      style={{ height: CELL, fontSize: 9, lineHeight: `${CELL}px` }}
                      className="text-[var(--muted)] text-right pr-1 select-none"
                    >
                      {i % 2 === 0 ? label : ""}
                    </div>
                  ))}
                </div>

                {/* Week columns */}
                {weekColumns.map((col, colIdx) => (
                  <div key={colIdx} className="flex flex-col" style={{ gap: GAP }}>
                    {col.map((day, rowIdx) => {
                      if (!day) {
                        return (
                          <div
                            key={rowIdx}
                            style={{ width: CELL, height: CELL, flexShrink: 0 }}
                          />
                        );
                      }
                      const cellStyle = getCellStyle(day.points, maxPoints);
                      return (
                        <Tooltip key={rowIdx}>
                          <TooltipTrigger asChild>
                            <div
                              style={{
                                width: CELL,
                                height: CELL,
                                borderRadius: 3,
                                flexShrink: 0,
                                cursor: "default",
                                transition: "transform 100ms ease",
                                ...cellStyle,
                              }}
                              className="hover:scale-125"
                            />
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="text-xs py-1.5 px-2"
                            style={{
                              backgroundColor: "var(--surface)",
                              border: "1px solid var(--border)",
                              color: "var(--text)",
                              boxShadow: "var(--shadow-md)",
                            }}
                          >
                            <div className="font-semibold">{format(day.date, "EEE, MMM d yyyy")}</div>
                            <div style={{ color: "var(--muted)" }}>
                              {day.points > 0 ? `${Math.round(day.points)} pts` : "No activity"}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-2 mt-3 justify-end">
                <span className="text-[10px]" style={{ color: "var(--muted)" }}>Less</span>
                {[0, 0.2, 0.5, 1].map((ratio, i) => (
                  <div
                    key={i}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: 3,
                      backgroundColor: ratio === 0 ? "var(--surface2)" : "var(--accent)",
                      opacity: ratio === 0 ? 1 : ratio === 0.2 ? 0.30 : ratio === 0.5 ? 0.60 : 1,
                    }}
                  />
                ))}
                <span className="text-[10px]" style={{ color: "var(--muted)" }}>More</span>
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}