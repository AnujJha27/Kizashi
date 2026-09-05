function mergeById(preferred = [], fallback = []) {
  const merged = new Map(fallback.map((item) => [item.id, item]));
  preferred.forEach((item) => merged.set(item.id, item));
  return [...merged.values()];
}

function mergeGrammar(preferred = [], fallback = []) {
  const fallbackById = new Map(fallback.map((item) => [item.id, item]));
  return mergeById(preferred.map((item) => {
    const fallbackItem = fallbackById.get(item.id);
    return fallbackItem ? { ...fallbackItem, ...item, aliases: item.aliases?.length ? item.aliases : fallbackItem.aliases, context: item.context?.japanese && item.context.translation ? item.context : fallbackItem.context } : item;
  }), fallback);
}

export function mergeContentModules(preferred, fallback) {
  const fallbackChapters = new Map(fallback.course.chapters.map((chapter) => [chapter.id, chapter]));
  const chapters = preferred.course.chapters.map((chapter) => {
    const fallbackChapter = fallbackChapters.get(chapter.id);
    if (!fallbackChapter) return chapter;
    const lessons = mergeById(chapter.lessons, fallbackChapter.lessons).map((lesson) => {
      const fallbackLesson = fallbackChapter.lessons.find((entry) => entry.id === lesson.id);
      return fallbackLesson ? { ...fallbackLesson, ...lesson, itemIds: [...new Set([...fallbackLesson.itemIds, ...lesson.itemIds])] } : lesson;
    });
    return { ...fallbackChapter, ...chapter, lessons };
  });
  const preferredChapterIds = new Set(chapters.map((chapter) => chapter.id));
  chapters.push(...fallback.course.chapters.filter((chapter) => !preferredChapterIds.has(chapter.id)));
  return {
    ...fallback,
    ...preferred,
    course: { ...fallback.course, ...preferred.course, chapters },
    vocabulary: mergeById(preferred.vocabulary, fallback.vocabulary),
    kanji: mergeById(preferred.kanji, fallback.kanji),
    grammar: mergeGrammar(preferred.grammar, fallback.grammar),
    readings: mergeById(preferred.readings, fallback.readings),
    listening: mergeById(preferred.listening, fallback.listening),
    grammarContrasts: mergeById(preferred.grammarContrasts, fallback.grammarContrasts),
    practiceQuestions: mergeById(preferred.practiceQuestions ?? [], fallback.practiceQuestions ?? []),
    sourceManifest: mergeById(preferred.sourceManifest ?? [], fallback.sourceManifest ?? []),
  };
}
