function weaknessScore(skill) {
  return (skill.coverage ?? 0) + (skill.recentAccuracy ?? 0) + (skill.retention ?? 0);
}

export function chooseReadinessPriority(skills, sections) {
  const belowMinimum = sections.find((section) => section.status === "below-minimum");
  const required = belowMinimum?.id === "listening"
    ? new Set(["listening"])
    : belowMinimum?.id === "language-knowledge-reading"
      ? new Set(["vocabulary", "kanji", "grammar", "reading"])
      : null;
  const scoped = required ? skills.filter((skill) => required.has(skill.skillType)) : skills;
  return [...(scoped.length ? scoped : skills)].sort((left, right) => weaknessScore(left) - weaknessScore(right))[0] ?? skills[0];
}

export function filterExamLevelQuestions(questions, level = "N5") {
  const filtered = questions.filter((question) => question.jlptLevel === level);
  return filtered.length ? filtered : questions;
}

export function aggregateExamEvidence(attempts, categories, limit = 3) {
  const selected = attempts.filter((attempt) => categories.some((category) => attempt.categoryBreakdown?.[category]?.total)).slice(0, limit);
  const score = selected.reduce((result, attempt) => categories.reduce((next, category) => ({
    correct: next.correct + (attempt.categoryBreakdown?.[category]?.correct ?? 0),
    total: next.total + (attempt.categoryBreakdown?.[category]?.total ?? 0),
  }), result), { correct: 0, total: 0 });
  return { ...score, ratio: score.total ? score.correct / score.total : null };
}
