"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useContentModule } from "@/components/content/use-content-module";
import { LessonPlayer } from "@/components/learning/lesson-player";
import { ItemNote } from "@/components/library/item-note";
import { LessonProgress } from "@/components/journey/lesson-progress";
import { PageIntro } from "@/components/ui/page-intro";
import { StatusPanel } from "@/components/ui/status-panel";
import { getCurriculumForTarget, getLessonItemsFromModule, type LessonContentItem } from "@/lib/curriculum";
import { readExamPlanPreferences, readLessonState } from "@/lib/session";
import type { GrammarContrast, Lesson, TargetLevel, VocabularyItem } from "@/lib/types";

type LessonView = { lesson: Lesson; items: LessonContentItem[]; contrasts: GrammarContrast[]; vocabulary: VocabularyItem[] };

export function LocalLesson({ initialTargetLevel = "N5", requestedLessonId, fallbackLesson, fallbackItems, fallbackContrasts }: Readonly<{ initialTargetLevel?: TargetLevel; requestedLessonId?: string; fallbackLesson: Lesson | null; fallbackItems: LessonContentItem[]; fallbackContrasts: GrammarContrast[] }>) {
  const module = useContentModule();
  const [targetLevel, setTargetLevel] = useState<TargetLevel>(initialTargetLevel);
  useEffect(() => {
    const refresh = () => { const requested = new URLSearchParams(window.location.search).get("level"); setTargetLevel(requested === "N4" || requested === "N5" ? requested : readExamPlanPreferences().targetLevel); };
    refresh();
    window.addEventListener("michi-profile-updated", refresh);
    return () => window.removeEventListener("michi-profile-updated", refresh);
  }, []);
  const targetModule = useMemo(() => getCurriculumForTarget(module, targetLevel), [module, targetLevel]);
  const lessons = targetModule.course.chapters.flatMap((chapter) => chapter.lessons);
  const lessonIds = lessons.map((entry) => entry.id).join("|");
  const [activeLessonId, setActiveLessonId] = useState(requestedLessonId ?? fallbackLesson?.id ?? "");
  useEffect(() => {
    if (requestedLessonId) {
      setActiveLessonId(requestedLessonId);
      return;
    }
    setActiveLessonId(lessons.find((entry) => readLessonState(entry.id).status !== "complete")?.id ?? lessons.at(-1)?.id ?? "");
  }, [lessonIds, requestedLessonId, targetLevel]);
  const lesson = lessons.find((entry) => entry.id === activeLessonId) ?? (fallbackLesson ? lessons.find((entry) => entry.id === fallbackLesson.id) : undefined) ?? fallbackLesson;
  const view: LessonView | null = lesson ? { lesson, items: lessons.some((entry) => entry.id === lesson.id) ? getLessonItemsFromModule(targetModule, lesson) : fallbackItems, contrasts: targetModule.grammarContrasts.length ? targetModule.grammarContrasts : fallbackContrasts, vocabulary: targetModule.vocabulary } : null;

  if (!view) return <StatusPanel eyebrow="No lesson selected" title="Your next lesson will appear here." description="Return to the Journey to choose a lesson when your path is ready." tone="error" />;

  const vocabulary = view.items.filter((item) => item.category === "vocabulary").length;
  const kanji = view.items.filter((item) => item.category === "kanji").length;
  const grammar = view.items.filter((item) => item.category === "grammar").length;
  const lessonNumber = lessons.findIndex((entry) => entry.id === view.lesson.id) + 1;

  return <div className="mx-auto max-w-5xl"><PageIntro eyebrow={`Learn · ${targetLevel} path`} title={view.lesson.title} description={view.lesson.description} action={{ label: "Back to Journey", href: `/journey${targetLevel === "N4" ? "?level=N4" : ""}` }} /><div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4"><div><p className="eyebrow">Lesson {lessonNumber} of {lessons.length}</p><p className="mt-1 text-xs text-[#9297a1]">One active lesson step at a time.</p></div><details className="relative"><summary className="cursor-pointer list-none rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#e5b85c]">All {targetLevel} lessons <span className="ml-2 text-[#e5b85c]">▾</span></summary><div className="absolute right-0 top-full z-30 mt-2 grid max-h-80 w-72 gap-1 overflow-y-auto rounded-xl border border-[#4b3a29] bg-[#111216]/95 p-2 shadow-2xl backdrop-blur-xl">{lessons.map((entry, index) => <Link key={entry.id} href={`/learn?lesson=${entry.id}${targetLevel === "N4" ? "&level=N4" : ""}`} aria-current={entry.id === view.lesson.id ? "page" : undefined} className={`rounded-lg px-3 py-2 ${entry.id === view.lesson.id ? "bg-[#3a2023]" : "hover:bg-[#211d18]"}`}><span className="block text-sm text-[#f5f5f2]">{index + 1}. {entry.title}</span><span className="jp-serif mt-1 block text-xs text-[#e5b85c]">{entry.subtitle}</span></Link>)}</div></details></div><div className="grid gap-6 lg:grid-cols-[1fr_.7fr]"><section className="surface-panel overflow-hidden p-7 sm:p-10"><p className="jp-serif mb-5 text-5xl text-[#e5b85c]">{view.lesson.subtitle}</p><LessonPlayer lessonId={view.lesson.id} items={view.items} contrasts={view.contrasts} vocabulary={view.vocabulary} kanji={targetModule.kanji} /><ItemNote itemId={view.lesson.id} /></section><aside className="border-l border-white/10 pl-6 lg:mt-4"><p className="eyebrow mb-4">This lesson</p><div className="space-y-4">{[["Vocabulary", vocabulary, "words"], ["Kanji", kanji, "characters"], ["Grammar", grammar, "points"]].map(([label, count, unit]) => <div key={label} className="flex items-center justify-between border-b border-[#292b31] pb-4 last:border-0 last:pb-0"><span className="text-sm text-[#9297a1]">{label}</span><span className="text-sm text-[#f5f5f2]">{count} <span className="text-xs text-[#676c75]">{unit}</span></span></div>)}</div><LessonProgress itemIds={view.items.map((item) => item.id)} /><div className="mt-7 border-l-2 border-[#e5b85c] pl-4"><p className="text-xs font-medium text-[#e5b85c]">Keep moving</p><p className="mt-1 text-sm text-[#9297a1]">Rate each card honestly; your next review is built from those answers.</p></div></aside></div></div>;
}
