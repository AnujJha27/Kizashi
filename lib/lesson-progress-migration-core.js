export function legacyLessonIdsFor(lessonId, aliases = {}) {
  return Object.entries(aliases)
    .filter(([, target]) => target === lessonId)
    .map(([legacyId]) => legacyId);
}

export function migratedCompletionState(lessonId, aliases = {}, readState = () => undefined) {
  for (const legacyId of legacyLessonIdsFor(lessonId, aliases)) {
    const state = readState(legacyId);
    if (state?.status === "complete") {
      return { lessonId, position: 0, status: "complete" };
    }
  }
  return undefined;
}
