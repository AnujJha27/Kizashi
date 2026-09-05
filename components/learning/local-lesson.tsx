"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { useContentModule } from "@/components/content/use-content-module";
import { LessonPlayer } from "@/components/learning/lesson-player";
import { ItemNote } from "@/components/library/item-note";
import { LessonProgress } from "@/components/journey/lesson-progress";
import { PageIntro } from "@/components/ui/page-intro";
import { StatusPanel } from "@/components/ui/status-panel";
import { getCurriculumForTarget, getLessonItemsFromModule, type LessonContentItem } from "@/lib/curriculum";
import { readExamPlanPreferences, readLessonState, readReviewRecords } from "@/lib/session";
import { getJourneyWorldState, getNextJourneyArea } from "@/lib/journey-world-core.js";
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
  const [records, setRecords] = useState<Record<string, { masteryState?: string; streak?: number }>>({});
  const [completed, setCompleted] = useState(false);
  useEffect(() => {
    if (requestedLessonId) {
      setActiveLessonId(requestedLessonId);
      return;
    }
    setActiveLessonId(lessons.find((entry) => readLessonState(entry.id).status !== "complete")?.id ?? lessons.at(-1)?.id ?? "");
  }, [lessonIds, requestedLessonId, targetLevel]);
  useEffect(() => {
    const refresh = () => setRecords(readReviewRecords());
    refresh();
    window.addEventListener("michi-review-updated", refresh);
    return () => window.removeEventListener("michi-review-updated", refresh);
  }, []);
  const lesson = lessons.find((entry) => entry.id === activeLessonId) ?? (fallbackLesson ? lessons.find((entry) => entry.id === fallbackLesson.id) : undefined) ?? fallbackLesson;
  const view: LessonView | null = lesson ? { lesson, items: lessons.some((entry) => entry.id === lesson.id) ? getLessonItemsFromModule(targetModule, lesson) : fallbackItems, contrasts: targetModule.grammarContrasts.length ? targetModule.grammarContrasts : fallbackContrasts, vocabulary: targetModule.vocabulary } : null;
  const worldLessons = useMemo(() => targetModule.course.chapters.flatMap((chapter) => chapter.lessons.map((entry) => ({ ...entry, region: chapter.region }))), [targetModule]);
  const world = useMemo(() => getJourneyWorldState({ lessonId: view?.lesson.id, lessons: worldLessons, records, targetLevel }), [records, targetLevel, view?.lesson.id, worldLessons]);
  const currentLessonIndex = view ? worldLessons.findIndex((entry) => entry.id === view.lesson.id) : -1;
  const areaHasMoreLessons = view ? worldLessons.slice(currentLessonIndex + 1).some((entry) => getJourneyWorldState({ lessonId: entry.id, lessons: worldLessons, targetLevel }).area.id === world.area.id) : false;
  const nextArea = useMemo(() => view && !areaHasMoreLessons ? getNextJourneyArea({ lessonId: view.lesson.id, lessons: worldLessons, targetLevel }) : null, [areaHasMoreLessons, targetLevel, view?.lesson.id, worldLessons]);
  const nextLesson = nextArea && currentLessonIndex >= 0 ? worldLessons.slice(currentLessonIndex + 1).find((entry) => getJourneyWorldState({ lessonId: entry.id, lessons: worldLessons, targetLevel }).area.id === nextArea.id) : null;
  useEffect(() => setCompleted(false), [view?.lesson.id]);

  if (!view) return <StatusPanel eyebrow="No lesson selected" title="Your next lesson will appear here." description="Return to the Journey to choose a lesson when your path is ready." tone="error" />;

  const vocabulary = view.items.filter((item) => item.category === "vocabulary").length;
  const kanji = view.items.filter((item) => item.category === "kanji").length;
  const grammar = view.items.filter((item) => item.category === "grammar").length;
  const contexts = view.items.filter((item) => item.category === "reading" || item.category === "listening").length;
  const lessonNumber = lessons.findIndex((entry) => entry.id === view.lesson.id) + 1;
  const completionSkills = [
    vocabulary ? "use the area's core vocabulary" : kanji ? "recognize the area's kanji" : null,
    grammar ? "notice its grammar in context" : null,
    contexts ? "carry it into a reading or listening scene" : null,
  ].filter((value): value is string => Boolean(value));

  return <div className="mx-auto max-w-5xl min-w-0"><PageIntro eyebrow={`Learn · ${targetLevel} path`} title={view.lesson.title} description={view.lesson.description} action={{ label: "Back to Journey", href: `/journey${targetLevel === "N4" ? "?level=N4" : ""}` }} /><div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4"><div><p className="eyebrow">Lesson {lessonNumber} of {lessons.length}</p><p className="mt-1 text-xs text-[#9297a1]">One active lesson step at a time.</p></div><details className="relative"><summary className="cursor-pointer list-none rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#e5b85c]">All {targetLevel} lessons <span className="ml-2 text-[#e5b85c]">▾</span></summary><div className="absolute right-0 top-full z-30 mt-2 grid max-h-80 w-72 gap-1 overflow-y-auto rounded-xl border border-[#4b3a29] bg-[#111216]/95 p-2 shadow-2xl backdrop-blur-xl">{lessons.map((entry, index) => <Link key={entry.id} href={`/learn?lesson=${entry.id}${targetLevel === "N4" ? "&level=N4" : ""}`} aria-current={entry.id === view.lesson.id ? "page" : undefined} className={`rounded-lg px-3 py-2 ${entry.id === view.lesson.id ? "bg-[#3a2023]" : "hover:bg-[#211d18]"}`}><span className="block text-sm text-[#f5f5f2]">{index + 1}. {entry.title}</span><span className="jp-serif mt-1 block text-xs text-[#e5b85c]">{entry.subtitle}</span></Link>)}</div></details></div><section className="lesson-opening relative mb-6 min-h-48 overflow-hidden rounded-2xl border border-[#292b31] p-6 sm:p-8" data-world-area={world.area.id} data-world-stage={world.stage.id} style={{ backgroundImage: `linear-gradient(90deg, rgba(11, 11, 13, .72), rgba(11, 11, 13, .28)), url(${world.area.visualAssets.lesson})`, backgroundSize: "cover", "--world-focal": world.area.focalPoint.desktop, "--world-focal-mobile": world.area.focalPoint.mobile } as CSSProperties}><div className="relative z-10 max-w-xl"><p className="eyebrow">Lesson opening · {world.stage.label}</p><p className="jp-serif mt-3 text-4xl text-[#e5b85c]">{world.area.japaneseTitle}</p><h2 className="mt-1 text-2xl font-medium text-[#f5f5f2]">{world.area.title}</h2><p className="mt-3 text-sm leading-6 text-[#c3c7ce]">Begin this lesson in the same place your route is passing through.</p></div></section><div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,.7fr)]"><section className="surface-panel min-w-0 overflow-hidden p-7 sm:p-10"><p className="jp-serif mb-5 text-5xl text-[#e5b85c]">{view.lesson.subtitle}</p><LessonPlayer lessonId={view.lesson.id} items={view.items} contrasts={view.contrasts} vocabulary={view.vocabulary} kanji={targetModule.kanji} onComplete={() => setCompleted(true)} />{completed && nextArea && nextLesson ? <section className="area-completion mt-6 rounded-xl border border-[#5d4c2c] bg-[#211d18]/70 p-5 sm:p-6" data-world-transition="area-complete" aria-live="polite"><p className="eyebrow">到着 · Arrived</p><p className="jp-serif mt-2 text-3xl text-[#e5b85c]">{world.area.japaneseTitle}</p><h3 className="mt-1 text-lg font-medium text-[#f5f5f2]">You can now move through this part of the route.</h3><ul className="mt-4 space-y-2 text-sm text-[#c3c7ce]">{completionSkills.map((skill) => <li key={skill}><span className="mr-2 text-[#6fb98f]" aria-hidden="true">✓</span>{skill}</li>)}</ul><div className="mt-5 border-t border-white/10 pt-4"><p className="eyebrow">Next stop · 次の駅</p><p className="jp-serif mt-2 text-2xl text-[#e5b85c]">{nextArea.japaneseTitle}</p><p className="mt-1 text-sm text-[#f5f5f2]">{nextArea.title}</p><p className="mt-2 text-xs leading-5 text-[#c3c7ce]">The route opens a new place after this cluster.</p><Link href={`/learn?lesson=${nextLesson.id}${targetLevel === "N4" ? "&level=N4" : ""}`} className="mt-4 inline-flex rounded-lg bg-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#0b0b0d]">Continue to {nextArea.title} →</Link></div></section> : null}<ItemNote itemId={view.lesson.id} /></section><section className="lesson-summary min-w-0 w-full max-w-full self-start overflow-hidden border-t border-white/10 pt-6 xl:mt-4 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0" aria-labelledby="lesson-summary-title"><p id="lesson-summary-title" className="eyebrow mb-4">This lesson</p><div className="space-y-4">{[["Vocabulary", vocabulary, "words"], ["Kanji", kanji, "characters"], ["Grammar", grammar, "points"]].map(([label, count, unit]) => <div key={label} className="flex items-center justify-between border-b border-[#292b31] pb-4 last:border-0 last:pb-0"><span className="text-sm text-[#9297a1]">{label}</span><span className="text-sm text-[#f5f5f2]">{count} <span className="text-xs text-[#676c75]">{unit}</span></span></div>)}</div><LessonProgress itemIds={view.items.map((item) => item.id)} /><div className="mt-7 border-l-2 border-[#e5b85c] pl-4"><p className="text-xs font-medium text-[#e5b85c]">Keep moving</p><p className="mt-1 text-sm text-[#9297a1]">Rate each card honestly; your next review is built from those answers.</p></div></section></div></div>;
}
