const DAILY_GOALS = [5, 10, 20, 30];

export function quickPracticeCount(minutes) {
  const duration = Number(minutes);
  return duration >= 20 ? 13 : duration >= 10 ? 10 : duration >= 5 ? 7 : duration >= 2 ? 4 : 2;
}

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
