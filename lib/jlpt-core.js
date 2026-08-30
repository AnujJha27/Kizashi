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
