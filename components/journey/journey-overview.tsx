"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { useContentModule } from "@/components/content/use-content-module";
import { DailySession } from "@/components/journey/daily-session";
import { ExamCountdown } from "@/components/profile/exam-countdown";
import { InkField } from "@/components/journey/ink-field";
import { JourneyMap } from "@/components/journey/journey-map";
import { LessonProgress } from "@/components/journey/lesson-progress";
import { RhythmBadge } from "@/components/journey/rhythm-badge";
import { currentLessonId, getCurriculumForTarget, getJourneyNodesForModule, getLessonItemsFromModule, getTopicCoverage, topicLabel, type LessonContentItem } from "@/lib/curriculum";
import { readContinueState, readDisplayName, readExamPlanPreferences, readLessonState, readReviewRecords, type ContinueState, type ReviewRecord } from "@/lib/session";
import type { TargetLevel } from "@/lib/types";
import { getJourneyWorldState } from "@/lib/journey-world-core.js";

type TopicProgress = { topic: string; held: number; total: number; counts: { vocabulary: number; kanji: number; grammar: number; reading: number; listening: number } };

function TopicProgressList({ topics }: Readonly<{ topics: TopicProgress[] }>) {
  return <div className="space-y-3">{topics.slice(0, 8).map(({ topic, held, total, counts }) => <Link key={topic} href={`/practice?mode=mixed&topic=${encodeURIComponent(topic)}`} className="block rounded-lg px-2 py-1 transition-colors hover:bg-[#211d18]/70"><div className="mb-1 flex justify-between gap-3 text-[11px]"><span className="text-[#c3c7ce]">{topicLabel(topic)}</span><span className="text-[#676c75]">{held} / {total}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#292b31]"><div className="h-full rounded-full bg-gradient-to-r from-[#4f9ac0] to-[#e5b85c]" style={{ width: `${(held / Math.max(total, 1)) * 100}%` }} /></div><p className="mt-1 text-[10px] text-[#676c75]">{counts.vocabulary} words · {counts.kanji} kanji · {counts.grammar} grammar · {counts.reading + counts.listening} contexts</p><span className="sr-only">Practice {topicLabel(topic)}</span></Link>)}</div>;
}

export function JourneyOverview() {
  const module = useContentModule();
  const [targetLevel, setTargetLevel] = useState<TargetLevel>("N5");
  const [showN4Transition, setShowN4Transition] = useState(false);
  useEffect(() => {
    const refresh = () => { const requested = new URLSearchParams(window.location.search).get("level"); setTargetLevel(requested === "N4" || requested === "N5" ? requested : readExamPlanPreferences().targetLevel); };
    refresh();
    window.addEventListener("michi-profile-updated", refresh);
    return () => window.removeEventListener("michi-profile-updated", refresh);
  }, []);
  useEffect(() => {
    const key = "michi.journey-level";
    const previous = window.sessionStorage.getItem(key);
    setShowN4Transition(targetLevel === "N4" && previous === "N5");
    window.sessionStorage.setItem(key, targetLevel);
  }, [targetLevel]);
  const targetModule = useMemo(() => getCurriculumForTarget(module, targetLevel), [module, targetLevel]);
  const lessons = targetModule.course.chapters.flatMap((chapter) => chapter.lessons);
  const lessonIds = lessons.map((entry) => entry.id).join("|");
  const [activeLessonId, setActiveLessonId] = useState(currentLessonId);
  const [displayName, setDisplayName] = useState("");
  const [greeting, setGreeting] = useState("こんにちは");
  const [records, setRecords] = useState<Record<string, ReviewRecord>>({});
  const [continueState, setContinueState] = useState<ContinueState | null>(null);

  useEffect(() => {
    const refresh = () => setActiveLessonId(lessons.find((entry) => readLessonState(entry.id).status !== "complete")?.id ?? lessons.at(-1)?.id ?? currentLessonId);
    refresh();
    window.addEventListener("michi-lesson-updated", refresh);
    return () => window.removeEventListener("michi-lesson-updated", refresh);
  }, [lessonIds]);

  useEffect(() => {
    const refresh = () => setDisplayName(readDisplayName());
    refresh();
    window.addEventListener("michi-profile-updated", refresh);
    return () => window.removeEventListener("michi-profile-updated", refresh);
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 5 || hour >= 18 ? "こんばんは" : hour < 12 ? "おはようございます" : "こんにちは");
  }, []);

  useEffect(() => {
    const refresh = () => setRecords(readReviewRecords());
    refresh();
    window.addEventListener("michi-review-updated", refresh);
    return () => window.removeEventListener("michi-review-updated", refresh);
  }, []);

  useEffect(() => {
    const refresh = () => setContinueState(readContinueState());
    refresh();
    window.addEventListener("michi-continue-updated", refresh);
    return () => window.removeEventListener("michi-continue-updated", refresh);
  }, []);

  const lesson = lessons.find((entry) => entry.id === activeLessonId) ?? lessons[0] ?? null;
  const continuedLesson = continueState?.kind === "lesson" ? lessons.find((entry) => entry.id === continueState.referenceId) : undefined;
  const activeContinue = continueState?.kind === "lesson" && !continuedLesson ? null : continueState;
  const continueHref = activeContinue?.href ?? (lesson ? `/learn?lesson=${lesson.id}${targetLevel === "N4" ? "&level=N4" : ""}` : "/practice");
  const continueLabel = activeContinue ? `Continue · ${activeContinue.kind === "lesson" ? continuedLesson?.title ?? "lesson" : activeContinue.label}` : lesson ? "Continue today’s path" : "Continue";
  const lessonItems = lesson ? getLessonItemsFromModule(targetModule, lesson) : [];
  const allItems: LessonContentItem[] = [...targetModule.vocabulary, ...targetModule.kanji, ...targetModule.grammar, ...targetModule.readings, ...targetModule.listening];
  const nodes = getJourneyNodesForModule(targetModule, lesson?.id, targetLevel);
  const level = targetLevel;
  const topics = getTopicCoverage(lessonItems, records).sort((left, right) => (left.held / Math.max(left.total, 1)) - (right.held / Math.max(right.total, 1)) || right.total - left.total);
  const lessonShape = { vocabulary: lessonItems.filter((item) => item.category === "vocabulary").length, kanji: lessonItems.filter((item) => item.category === "kanji").length, grammar: lessonItems.filter((item) => item.category === "grammar").length, contexts: lessonItems.filter((item) => item.category === "reading" || item.category === "listening").length };
  const worldLessons = useMemo(() => targetModule.course.chapters.flatMap((chapter) => chapter.lessons.map((entry) => ({ ...entry, region: chapter.region }))), [targetModule]);
  const world = useMemo(() => getJourneyWorldState({ lessonId: lesson?.id, lessons: worldLessons, records, targetLevel }), [lesson?.id, records, targetLevel, worldLessons]);

  return <div className="journey-page mx-auto max-w-6xl">
    {showN4Transition ? <section className="world-transition relative mb-8 overflow-hidden rounded-2xl border border-[#617486]/60 p-6 sm:p-10" data-world-transition="n5-to-n4" data-world-area={world.area.id} style={{ backgroundImage: `linear-gradient(90deg, rgba(8, 14, 22, .84), rgba(8, 14, 22, .42)), url(${world.area.visualAssets.hero})`, backgroundSize: "cover", "--world-focal": world.area.focalPoint.desktop, "--world-focal-mobile": world.area.focalPoint.mobile } as CSSProperties}><div className="relative z-10 max-w-xl"><p className="eyebrow text-[#e5b85c]">新しい道 · A new road</p><h2 className="jp-serif mt-3 text-4xl text-[#f1cf7c]">The familiar town is behind you.</h2><p className="mt-4 text-sm leading-7 text-[#c3c7ce]">N4 opens a wider Japan: longer conversations, denser reading, more natural listening, and greater independence.</p><Link href={continueHref} onClick={() => setShowN4Transition(false)} className="mt-6 inline-flex rounded-xl bg-[#e5b85c] px-4 py-3 text-sm font-semibold text-[#0b0b0d]">Continue to N4 <span className="ml-2" aria-hidden="true">→</span></Link></div></section> : null}
    <section className="journey-hero relative mb-8 overflow-hidden rounded-2xl border border-[#292b31] p-6 sm:p-10" data-world-area={world.area.id} data-world-stage={world.stage.id} style={{ backgroundImage: `linear-gradient(90deg, rgba(11, 11, 13, .68) 0%, rgba(11, 11, 13, .4) 53%, rgba(11, 11, 13, .1) 100%), linear-gradient(180deg, rgba(12, 14, 23, .08), rgba(6, 8, 12, .38)), url(${world.area.visualAssets.hero})`, "--world-focal": world.area.focalPoint.desktop, "--world-focal-mobile": world.area.focalPoint.mobile } as CSSProperties}>
      <InkField className="ink-field journey-hero-ink" />
      <div className="quiet-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="jp-serif mb-3 text-2xl tracking-[.18em] text-[#e5b85c]">{world.area.japaneseTitle}</p>
          <p className="eyebrow mb-4">{greeting}{displayName ? ` · ${displayName}さん` : ""} · {world.area.title} · {level} path</p>
          <h1 className="max-w-2xl text-4xl leading-tight tracking-tight text-[#f5f5f2] sm:text-6xl">Continue your path<span className="text-[#e34a3f]">.</span></h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#9297a1]">{world.area.description} One short session is enough; your plan starts with {lesson?.title ?? "the next lesson"}.</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">{lesson ? <Link href={continueHref} className="inline-flex items-center gap-3 rounded-xl bg-[#e34a3f] px-5 py-3.5 text-sm font-semibold text-[#0b0b0d] hover:bg-[#ef675d]">{continueLabel}<span aria-hidden="true">→</span></Link> : null}<Link href={`/journey?level=${targetLevel === "N4" ? "N5" : "N4"}`} prefetch={false} onClick={() => setTargetLevel(targetLevel === "N4" ? "N5" : "N4")} className="rounded-xl border border-[#5d3936] px-4 py-3 text-sm text-[#f5f5f2] hover:border-[#e5b85c]">Switch to {targetLevel === "N4" ? "N5" : "N4"}</Link></div>
        </div>
        <div className="flex gap-8 border-t border-[#292b31] pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <div><p className="jp-serif text-lg text-[#e5b85c]">今日</p><p className="mt-1 text-[10px] uppercase tracking-[.14em] text-[#676c75]">{lesson?.estimatedMinutes ?? 0} min lesson</p></div>
          <RhythmBadge />
        </div>
      </div>
    </section>

    {lesson ? <div className="mb-8"><DailySession lessonId={lesson.id} items={lessonItems} allItems={allItems} module={targetModule} targetLevel={targetLevel} world={world} /></div> : null}

    <div className="mb-8"><ExamCountdown /></div>

    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,.75fr)]">
      <section className="min-w-0">
        <div className="mb-4 flex items-end justify-between"><div><p className="eyebrow">Your route</p><h2 className="mt-1 text-xl font-medium">{targetModule.course.title}</h2></div><span className="text-xs text-[#676c75]">{lessons.length} lesson{lessons.length === 1 ? "" : "s"}</span></div>
        <JourneyMap nodes={nodes} focusLessonId={lesson?.id} targetLevel={targetLevel} world={world} />
      </section>

      <aside className="min-w-0 space-y-6">
        <section className="surface-panel p-6">
          <p className="eyebrow mb-4">Current lesson</p>
          {lesson ? <><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-medium">{lesson.title}</h2><p className="jp-serif mt-1 text-lg text-[#e5b85c]">{lesson.subtitle}</p></div><span className="rounded-full bg-[#211d18] px-2.5 py-1 text-[10px] text-[#e5b85c]">{lesson.estimatedMinutes} min</span></div><LessonProgress itemIds={lesson.itemIds} /><p className="mt-5 text-sm leading-6 text-[#9297a1]">{lesson.description}</p><Link href={`/learn?lesson=${lesson.id}`} className="mt-6 inline-flex text-sm font-medium text-[#e5b85c] hover:text-[#f5f5f2]">Open lesson <span className="ml-2" aria-hidden="true">→</span></Link></> : <p className="text-sm text-[#9297a1]">Your next lesson will appear here.</p>}
        </section>

        <section className="surface-panel-raised p-6">
          <p className="eyebrow mb-3">Module shape</p>
          <p className="text-3xl font-semibold text-[#f5f5f2]">{lessonItems.length}<span className="ml-2 text-sm font-normal text-[#9297a1]">items in this lesson</span></p>
          <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-3 border-y border-white/10 py-4 text-xs"><div><span className="text-xl text-[#e5b85c]">{lessonShape.vocabulary}</span><span className="ml-2 text-[#676c75]">words</span></div><div><span className="text-xl text-[#e5b85c]">{lessonShape.kanji}</span><span className="ml-2 text-[#676c75]">kanji</span></div><div><span className="text-xl text-[#e5b85c]">{lessonShape.grammar}</span><span className="ml-2 text-[#676c75]">grammar</span></div><div><span className="text-xl text-[#e5b85c]">{lessonShape.contexts}</span><span className="ml-2 text-[#676c75]">contexts</span></div></div>
          <div className="mt-5 border-t border-white/10 pt-4"><div className="mb-3 flex items-end justify-between gap-3"><div><p className="eyebrow">Topic coverage</p><p className="mt-1 text-xs text-[#9297a1]">Your least-held topics rise first.</p></div><Link href="/library" className="text-xs text-[#e5b85c] hover:text-[#f1cf7c]">Open shelf →</Link></div><TopicProgressList topics={topics} /></div>
        </section>
      </aside>
    </div>
  </div>;
}
