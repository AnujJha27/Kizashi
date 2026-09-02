"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getDueReviewIds, getTodayStudyMinutes, readDailyGoal, readExamAttempts, readReviewRecords } from "@/lib/session";
import { dailyGoalProgress } from "@/lib/study-core.js";
import type { LessonContentItem } from "@/lib/curriculum";
import { getN5Readiness } from "@/lib/jlpt";
import type { TargetLevel } from "@/lib/types";

export function DailySession({ lessonId, items, allItems = items, targetLevel = "N5" }: Readonly<{ lessonId: string; items: LessonContentItem[]; allItems?: LessonContentItem[]; targetLevel?: TargetLevel }>) {
  const [dueIds, setDueIds] = useState<string[] | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [goal, setGoal] = useState(10);
  const [priority, setPriority] = useState<LessonContentItem["category"] | null>(null);

  useEffect(() => {
    const refresh = () => { setDueIds(getDueReviewIds()); setMinutes(getTodayStudyMinutes()); setGoal(readDailyGoal()); setPriority(getN5Readiness(allItems, readReviewRecords(), readExamAttempts()).priority.skillType); };
    refresh();
    window.addEventListener("michi-review-updated", refresh);
    window.addEventListener("michi-study-stats-updated", refresh);
    window.addEventListener("michi-profile-updated", refresh);
    window.addEventListener("michi-exam-attempt-updated", refresh);
    return () => { window.removeEventListener("michi-review-updated", refresh); window.removeEventListener("michi-study-stats-updated", refresh); window.removeEventListener("michi-profile-updated", refresh); window.removeEventListener("michi-exam-attempt-updated", refresh); };
  }, [allItems]);

  const due = dueIds === null ? null : allItems.filter((item) => dueIds.includes(item.id)).length;
  const dueItems = new Set(dueIds ?? []);
  const counts = ["vocabulary", "kanji", "grammar", "reading", "listening"].map((category) => ({ category, count: allItems.filter((item) => item.category === category && dueItems.has(item.id)).length }));
  const priorityLabels: Record<LessonContentItem["category"], string> = { vocabulary: "Vocabulary", kanji: "Kanji", grammar: "Grammar", reading: "Reading", listening: "Listening" };
  const levelQuery = `&level=${targetLevel}`;
  const priorityHref = priority === "reading" || priority === "listening" ? "/immersion" : priority ? `/practice?mode=${priority}${levelQuery}` : `/practice?mode=pass${levelQuery}`;
  const progress = minutes === null ? null : dailyGoalProgress(minutes, goal);
  const continueHref = due ? "/review" : `/learn?lesson=${lessonId}${targetLevel === "N4" ? "&level=N4" : ""}`;
  const continueLabel = due ? "Continue review" : "Continue lesson";
  const plan = [
    { step: "01", label: "Review", title: due === null ? "Checking…" : due ? `${due} due item${due === 1 ? "" : "s"}` : "You're clear", detail: due ? "Keep yesterday's work warm." : "Try a short immersion instead.", href: due ? "/review" : "/immersion" },
    { step: "02", label: "Learn", title: "Continue the lesson", detail: items.length ? `${items.length} items · ${lessonId.replace(/^lesson-/, "").replaceAll("-", " ")}` : "Your next lesson", href: `/learn?lesson=${lessonId}${targetLevel === "N4" ? "&level=N4" : ""}` },
    { step: "03", label: "Practice", title: priority ? `Strengthen ${priorityLabels[priority]}` : "Mix the path", detail: "A focused pass based on recent signals.", href: priorityHref },
    { step: "04", label: "Immerse", title: "Hear Japanese in context", detail: "Short listening and reading detours.", href: "/immersion" },
  ];

  return <section className="surface-panel-raised relative overflow-hidden p-6" style={{ backgroundImage: "linear-gradient(90deg, rgba(12, 18, 29, .78) 0%, rgba(18, 27, 43, .6) 48%, rgba(18, 24, 34, .25) 100%), linear-gradient(180deg, rgba(8, 12, 20, .06), rgba(7, 9, 14, .4)), url('/daily-journey.png')", backgroundPosition: "center", backgroundSize: "cover", backgroundRepeat: "no-repeat" }}><div className="relative z-10 flex flex-col gap-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="eyebrow">Today · 今日</p><h2 className="mt-2 text-xl font-medium">One short path is enough.</h2><p className="mt-2 text-sm text-[#9297a1]">{due === null ? "Checking your review rhythm…" : due ? `${due} item${due === 1 ? "" : "s"} need another pass before new work.` : `${items.length} lesson items ready when you are.`}</p>{progress ? <><div className="mt-4 flex items-center justify-between text-xs text-[#9297a1]"><span>Daily rhythm</span><span>{progress.minutes} / {progress.goal} min</span></div><div className="mt-2 h-1.5 max-w-sm overflow-hidden rounded-full bg-[#292b31]"><div className="h-full rounded-full bg-gradient-to-r from-[#e34a3f] to-[#e5b85c]" style={{ width: `${progress.percent}%` }} /></div></> : null}</div><div className="flex shrink-0 flex-wrap gap-2"><Link href={continueHref} className="rounded-xl bg-[#e34a3f] px-4 py-3 text-sm font-semibold text-[#0b0b0d] hover:bg-[#ef675d]">{continueLabel} <span aria-hidden="true">→</span></Link>{[2, 5, 10, 20, 30].map((duration) => <Link key={duration} href={`/practice?mode=quick&duration=${duration}`} className="rounded-xl border border-[#5d3936] px-3 py-3 text-sm font-semibold text-[#f5f5f2] hover:border-[#e34a3f]">{duration} min</Link>)}</div></div><div className="border-t border-white/10 pt-5"><div className="mb-4 flex items-end justify-between gap-3"><div><p className="eyebrow">Today&apos;s path</p><p className="mt-1 text-xs text-[#9297a1]">Kizashi chooses the order; you can take any detour.</p></div><span className="text-xs text-[#e5b85c]">{progress ? `${progress.percent}% today` : "Loading"}</span></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{plan.map((block) => <Link key={block.step} href={block.href} className="border-l border-white/15 pl-3 hover:border-[#e5b85c]"><p className="eyebrow text-[10px]">{block.step} · {block.label}</p><p className="mt-2 text-sm font-medium text-[#f5f5f2]">{block.title}</p><p className="mt-1 text-xs leading-5 text-[#9297a1]">{block.detail}</p></Link>)}</div></div></div></section>;
}
