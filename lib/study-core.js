const DAILY_GOALS = [5, 10, 20, 30];

export function dailyGoalProgress(minutes, goal) {
  const normalizedGoal = DAILY_GOALS.includes(Number(goal)) ? Number(goal) : 10;
  const normalizedMinutes = Number.isFinite(minutes) ? Math.max(0, minutes) : 0;
  return {
    minutes: normalizedMinutes,
    goal: normalizedGoal,
    percent: Math.min(100, Math.round((normalizedMinutes / normalizedGoal) * 100)),
    complete: normalizedMinutes >= normalizedGoal,
  };
}
