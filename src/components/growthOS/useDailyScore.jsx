/**
 * useDailyScore — calculates the "God-Score" (0–100) for a given date.
 *
 * Weights:
 *   50% — Goals Met:   % of weekly goals already achieved by today's logs
 *   30% — Raw Output:  log count today, capped at 8 (full score = 8+ logs)
 *   20% — Consistency: bonus if something was logged yesterday (streak bonus)
 */
export function calcDailyScore({ todayLogs, yesterdayLogs, goals }) {
  const weeklyGoals = goals?.weekly || {};

  // ── 50%: Goals Met ──────────────────────────────────────────────────────────
  const activeGoalCats = Object.keys(weeklyGoals).filter(id => weeklyGoals[id] > 0);
  let goalScore = 0;

  if (activeGoalCats.length > 0) {
    // Daily target = weekly goal / 7
    const dailyHits = activeGoalCats.map(catId => {
      const target = weeklyGoals[catId] / 7;
      const actual = todayLogs
        .filter(l => l.categoryId === catId)
        .reduce((sum, l) => sum + (l.value || 0), 0);
      return Math.min(1, actual / (target || 1));
    });
    goalScore = dailyHits.reduce((s, v) => s + v, 0) / activeGoalCats.length;
  } else {
    // No goals set: give partial credit if they logged anything
    goalScore = todayLogs.length > 0 ? 0.5 : 0;
  }

  // ── 30%: Raw Output ─────────────────────────────────────────────────────────
  const MAX_LOGS = 8;
  const rawScore = Math.min(1, todayLogs.length / MAX_LOGS);

  // ── 20%: Consistency ────────────────────────────────────────────────────────
  const consistencyScore = yesterdayLogs.length > 0 ? 1 : 0;

  const total = goalScore * 50 + rawScore * 30 + consistencyScore * 20;
  return Math.round(Math.min(100, Math.max(0, total)));
}