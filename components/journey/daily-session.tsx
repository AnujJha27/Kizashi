"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AudioControls } from "@/components/learning/audio-controls";
import { JapaneseText } from "@/components/learning/japanese-text";
import { LessonPlayer } from "@/components/learning/lesson-player";
import { ReadingPanel } from "@/components/learning/reading-panel";
import { LazyPractice } from "@/components/practice/lazy-practice";
import { getDueReviewIds, getTodayStudyMinutes, readDailyGoal, readExamAttempts, readReviewRecords } from "@/lib/session";
import { dailyGoalProgress } from "@/lib/study-core.js";
import type { LessonContentItem } from "@/lib/curriculum";
import { getN5Readiness } from "@/lib/jlpt";
import type { N5Module, TargetLevel } from "@/lib/types";

type TodayStage = "review" | "learn" | "practice" | "listen" | "read" | "done";
const TODAY_FLOW_KEY = "michi.today-flow";

function dateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function DailySession({ lessonId, items, allItems = items, module, targetLevel = "N5" }: Readonly<{ lessonId: string; items: LessonContentItem[]; allItems?: LessonContentItem[]; module: N5Module; targetLevel?: TargetLevel }>) {
  const [dueIds, setDueIds] = useState<string[] | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [goal, setGoal] = useState(10);
  const [priority, setPriority] = useState<LessonContentItem["category"] | null>(null);
  const [duration, setDuration] = useState(10);
  const [stage, setStage] = useState<TodayStage | null>(null);
  const [flowVisible, setFlowVisible] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const refresh = () => { setDueIds(getDueReviewIds()); setMinutes(getTodayStudyMinutes()); setGoal(readDailyGoal()); setPriority(getN5Readiness(allItems, readReviewRecords(), readExamAttempts()).priority.skillType); };
    refresh();
    window.addEventListener("michi-review-updated", refresh);
    window.addEventListener("michi-study-stats-updated", refresh);
    window.addEventListener("michi-profile-updated", refresh);
    window.addEventListener("michi-exam-attempt-updated", refresh);
    return () => { window.removeEventListener("michi-review-updated", refresh); window.removeEventListener("michi-study-stats-updated", refresh); window.removeEventListener("michi-profile-updated", refresh); window.removeEventListener("michi-exam-attempt-updated", refresh); };
  }, [allItems]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = JSON.parse(window.localStorage.getItem(TODAY_FLOW_KEY) ?? "null") as { date?: string; lessonId?: string; targetLevel?: TargetLevel; duration?: number; stage?: TodayStage } | null;
      if (saved?.date === dateKey() && saved.lessonId === lessonId && saved.targetLevel === targetLevel) {
        if ([2, 5, 10, 20, 30].includes(saved.duration ?? 0)) setDuration(saved.duration!);
        if (["review", "learn", "practice", "listen", "read", "done"].includes(saved.stage ?? "")) { setStage(saved.stage!); setFlowVisible(true); }
      }
    } catch {
      // A malformed local flow should never block the Today route.
    }
    setRestored(true);
  }, [lessonId, targetLevel]);

  const due = dueIds === null ? null : allItems.filter((item) => dueIds.includes(item.id)).length;
  const dueItemIds = new Set(dueIds ?? []);
  const counts = ["vocabulary", "kanji", "grammar", "reading", "listening"].map((category) => ({ category, count: allItems.filter((item) => item.category === category && dueItemIds.has(item.id)).length }));
  const priorityLabels: Record<LessonContentItem["category"], string> = { vocabulary: "Vocabulary", kanji: "Kanji", grammar: "Grammar", reading: "Reading", listening: "Listening" };
  const levelQuery = `&level=${targetLevel}`;
  const priorityHref = priority === "reading" || priority === "listening" ? "/immersion" : priority ? `/practice?mode=${priority}${levelQuery}` : `/practice?mode=pass${levelQuery}`;
  const progress = minutes === null ? null : dailyGoalProgress(minutes, goal);
  const flowStages = useMemo<TodayStage[]>(() => {
    if (due === null) return [];
    const stages: TodayStage[] = [];
    if (due) stages.push("review");
    if (items.length) stages.push("learn");
    stages.push("practice");
    if (duration >= 20 && module.listening.length) stages.push("listen");
    if (duration >= 30 && module.readings.length) stages.push("read");
    return stages;
  }, [due, duration, items.length, module.listening.length, module.readings.length]);
  const dueItems = allItems.filter((item) => dueItemIds.has(item.id));
  const listening = module.listening[0];
  const reading = module.readings[0];
  const stageIndex = stage && stage !== "done" ? flowStages.indexOf(stage) : -1;
  const startFlow = () => { setStage(flowStages[0] ?? "done"); setFlowVisible(true); };
  const resumeFlow = () => setFlowVisible(true);
  const advance = () => setStage(flowStages[stageIndex + 1] ?? "done");
  const resetFlow = () => { setStage(null); setFlowVisible(false); if (typeof window !== "undefined") window.localStorage.removeItem(TODAY_FLOW_KEY); };
  const plan = [
    { step: "01", label: "Review", title: due === null ? "Checking…" : due ? `${due} due item${due === 1 ? "" : "s"}` : "You're clear", detail: due ? "Keep yesterday's work warm." : "Try a short immersion instead.", href: due ? "/review" : "/immersion" },
    { step: "02", label: "Learn", title: "Continue the lesson", detail: items.length ? `${items.length} items · ${lessonId.replace(/^lesson-/, "").replaceAll("-", " ")}` : "Your next lesson", href: `/learn?lesson=${lessonId}${targetLevel === "N4" ? "&level=N4" : ""}` },
    { step: "03", label: "Practice", title: priority ? `Strengthen ${priorityLabels[priority]}` : "Mix the path", detail: "A focused pass based on recent signals.", href: priorityHref },
    { step: "04", label: "Immerse", title: "Hear Japanese in context", detail: "Short listening and reading detours.", href: "/immersion" },
  ];

  useEffect(() => {
    if (!restored || !stage || typeof window === "undefined") return;
    window.localStorage.setItem(TODAY_FLOW_KEY, JSON.stringify({ date: dateKey(), lessonId, targetLevel, duration, stage }));
  }, [duration, lessonId, restored, stage, targetLevel]);

  useEffect(() => {
    if (!restored || due === null || !stage || stage === "done") return;
    if (!flowStages.includes(stage)) setStage(flowStages[0] ?? "done");
  }, [due, flowStages, restored, stage]);

  return <section className="surface-panel-raised relative overflow-hidden p-6" style={{ backgroundImage: "linear-gradient(90deg, rgba(12, 18, 29, .78) 0%, rgba(18, 27, 43, .6) 48%, rgba(18, 24, 34, .25) 100%), linear-gradient(180deg, rgba(8, 12, 20, .06), rgba(7, 9, 14, .4)), url('/daily-journey.png')", backgroundPosition: "center", backgroundSize: "cover", backgroundRepeat: "no-repeat" }}><div className="relative z-10 flex flex-col gap-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="eyebrow">Today · 今日</p><h2 className="mt-2 text-xl font-medium">One short path is enough.</h2><p className="mt-2 text-sm text-[#9297a1]">{due === null ? "Checking your review rhythm…" : due ? `${due} item${due === 1 ? "" : "s"} need another pass before new work.` : `${items.length} lesson items ready when you are.`}</p>{progress ? <><div className="mt-4 flex items-center justify-between text-xs text-[#9297a1]"><span>Daily rhythm</span><span>{progress.minutes} / {progress.goal} min</span></div><div className="mt-2 h-1.5 max-w-sm overflow-hidden rounded-full bg-[#292b31]"><div className="h-full rounded-full bg-gradient-to-r from-[#e34a3f] to-[#e5b85c]" style={{ width: `${progress.percent}%` }} /></div></> : null}</div><div className="flex shrink-0 flex-wrap gap-2"><button type="button" disabled={due === null} onClick={() => stage && !flowVisible ? resumeFlow() : stage ? resetFlow() : startFlow()} className="rounded-xl bg-[#e34a3f] px-4 py-3 text-sm font-semibold text-[#0b0b0d] hover:bg-[#ef675d] disabled:cursor-wait disabled:opacity-60">{stage && flowVisible && stage !== "done" ? "Restart today" : stage && !flowVisible ? "Resume today" : stage === "done" ? "Start again" : "Start today"} <span aria-hidden="true">→</span></button>{[2, 5, 10, 20, 30].map((value) => <button key={value} type="button" onClick={() => { setDuration(value); resetFlow(); }} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${duration === value ? "border-[#e5b85c] bg-[#302818] text-[#f1cf7c]" : "border-[#5d3936] text-[#f5f5f2] hover:border-[#e34a3f]"}`}>{value} min</button>)}</div></div>{flowVisible && stage && stage !== "done" ? <section className="border-t border-white/10 pt-5" aria-live="polite"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">Today in progress</p><p className="mt-1 text-sm text-[#c3c7ce]">Step {stageIndex + 1} of {flowStages.length} · {stage === "review" ? "Review" : stage === "learn" ? "Learn" : stage === "practice" ? "Practice" : stage === "listen" ? "Listen" : "Read"}</p></div><button type="button" onClick={() => setFlowVisible(false)} className="text-xs text-[#9297a1] hover:text-[#f5f5f2]">Save and leave</button></div><div className="mb-6 flex gap-1" aria-label="Today progress">{flowStages.map((value, index) => <span key={value} className={`h-1.5 flex-1 rounded-full ${index < stageIndex ? "bg-[#6fb98f]" : index === stageIndex ? "bg-[#e5b85c]" : "bg-[#292b31]"}`} />)}</div>{stage === "review" ? <LessonPlayer lessonId={`today-review-${lessonId}`} items={dueItems} contrasts={module.grammarContrasts} vocabulary={module.vocabulary} kanji={module.kanji} onComplete={advance} /> : null}{stage === "learn" ? <LessonPlayer lessonId={lessonId} items={items} contrasts={module.grammarContrasts} vocabulary={module.vocabulary} kanji={module.kanji} onComplete={advance} /> : null}{stage === "practice" ? <LazyPractice mode="quick" duration={duration} targetLevel={targetLevel} onComplete={advance} /> : null}{stage === "listen" && listening ? <div className="rounded-xl border border-white/10 bg-[#101b2b]/60 p-5"><p className="eyebrow">Listen · one short scene</p><h3 className="mt-2 jp-serif text-2xl text-[#f5f5f2]"><JapaneseText text={listening.title} vocabulary={module.vocabulary} kanji={module.kanji} always inspect={false} /></h3><AudioControls text={listening.transcript} externalUrl={listening.audioUrl} metadata={listening.audio} className="mt-5" /><button type="button" onClick={advance} className="mt-5 rounded-lg bg-[#e5b85c] px-4 py-2.5 text-xs font-semibold text-[#0b0b0d]">Continue to reading →</button></div> : null}{stage === "read" && reading ? <div className="rounded-xl border border-white/10 bg-[#101b2b]/60 p-5"><p className="eyebrow">Read · one short passage</p><ReadingPanel item={reading} vocabulary={module.vocabulary} kanji={module.kanji} always /><button type="button" onClick={advance} className="mt-5 rounded-lg bg-[#e5b85c] px-4 py-2.5 text-xs font-semibold text-[#0b0b0d]">Finish today →</button></div> : null}</section> : stage === "done" && flowVisible ? <section className="border-t border-white/10 pt-5" aria-live="polite"><p className="eyebrow">Today complete · 今日の勉強</p><h3 className="mt-2 jp-serif text-3xl text-[#e5b85c]">よくできました</h3><p className="mt-2 text-sm text-[#c3c7ce]">You finished this {duration}-minute path. Stop here, or start another small pass when you want.</p><div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#8bcca6]">{flowStages.map((value) => <span key={value}>✓ {value === "review" ? "Reviewed" : value === "learn" ? "Learned" : value === "practice" ? "Practiced" : value === "listen" ? "Listened" : "Read"}</span>)}</div><button type="button" onClick={resetFlow} className="mt-5 rounded-lg border border-[#3f4652] px-4 py-2.5 text-xs text-[#c3c7ce]">Start another path</button></section> : null}<div className="border-t border-white/10 pt-5"><div className="mb-4 flex items-end justify-between gap-3"><div><p className="eyebrow">Today&apos;s path</p><p className="mt-1 text-xs text-[#9297a1]">Kizashi chooses the order; you can take any detour.</p></div><span className="text-xs text-[#e5b85c]">{progress ? `${progress.percent}% today` : "Loading"}</span></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{plan.map((block) => <Link key={block.step} href={block.href} className="border-l border-white/15 pl-3 hover:border-[#e5b85c]"><p className="eyebrow text-[10px]">{block.step} · {block.label}</p><p className="mt-2 text-sm font-medium text-[#f5f5f2]">{block.title}</p><p className="mt-1 text-xs leading-5 text-[#9297a1]">{block.detail}</p></Link>)}</div></div></div></section>;
}
