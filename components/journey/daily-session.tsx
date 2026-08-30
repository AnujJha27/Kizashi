"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getDueReviewIds, getTodayStudyMinutes, readDailyGoal, readExamAttempts, readReviewRecords } from "@/lib/session";
import type { LessonContentItem } from "@/lib/curriculum";
import { getN5Readiness } from "@/lib/jlpt";

export function DailySession({ lessonId, items, allItems = items }: Readonly<{ lessonId: string; items: LessonContentItem[]; allItems?: LessonContentItem[] }>) {
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
  const priorityHref = priority ? `/practice?mode=${priority}` : "/practice?mode=pass";
  return <section className="surface-panel-raised relative overflow-hidden p-6" style={{ backgroundImage: "linear-gradient(90deg, rgba(12, 18, 29, .78) 0%, rgba(18, 27, 43, .6) 48%, rgba(18, 24, 34, .25) 100%), linear-gradient(180deg, rgba(8, 12, 20, .06), rgba(7, 9, 14, .4)), url('/daily-journey.png')", backgroundPosition: "center", backgroundSize: "cover", backgroundRepeat: "no-repeat" }}><div className="relative z-10 flex flex-col gap-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="eyebrow">Today&apos;s journey · 今日の道</p><h2 className="mt-2 text-xl font-medium">A small session is waiting.</h2><p className="mt-2 text-sm text-[#9297a1]">{due === null ? "Checking your review rhythm…" : due ? `${due} item${due === 1 ? "" : "s"} across your path need another pass.` : `${items.length} lesson items · a calm first pass.`}</p>{priority ? <p className="mt-2 text-xs text-[#e5b85c]">Next focus · {priorityLabels[priority]}</p> : null}{minutes !== null ? <><div className="mt-4 flex items-center justify-between text-xs text-[#9297a1]"><span>Daily rhythm</span><span>{Math.min(minutes, goal)} / {goal} min</span></div><div className="mt-2 h-1.5 max-w-sm overflow-hidden rounded-full bg-[#292b31]"><div className="h-full rounded-full bg-gradient-to-r from-[#e34a3f] to-[#e5b85c]" style={{ width: `${Math.min(100, (minutes / goal) * 100)}%` }} /></div></> : null}{due ? <div className="mt-4 flex flex-wrap gap-2">{counts.filter((entry) => entry.count).map((entry) => <span key={entry.category} className="rounded-lg bg-[#101b2b]/70 px-3 py-2 text-xs text-[#c3c7ce]">{entry.count} {entry.category}</span>)}</div> : null}</div><div className="flex shrink-0 flex-wrap gap-2"><Link href={`/learn?lesson=${lessonId}`} className="rounded-xl bg-[#e34a3f] px-4 py-3 text-sm font-semibold text-[#0b0b0d] hover:bg-[#ef675d]">Begin lesson <span aria-hidden="true">→</span></Link>{due ? <Link href="/review" className="rounded-xl border border-[#5d3936] px-3 py-3 text-sm font-semibold text-[#e5b85c] hover:border-[#e34a3f]">Review due</Link> : null}{[5, 10, 20, 30].map((duration) => <Link key={duration} href={`/practice?mode=quick&duration=${duration}`} className="rounded-xl border border-[#5d3936] px-3 py-3 text-sm font-semibold text-[#f5f5f2] hover:border-[#e34a3f]">{duration} min</Link>)}</div></div><div className="grid gap-2 border-t border-white/10 pt-5 sm:grid-cols-3"><Link href={`/learn?lesson=${lessonId}`} className="rounded-xl border border-white/10 bg-[#101b2b]/55 p-3 hover:border-[#e5b85c]/60"><p className="eyebrow">01 · Learn</p><p className="mt-1 text-sm text-[#f5f5f2]">Continue the lesson</p></Link><Link href={priorityHref} className="rounded-xl border border-white/10 bg-[#101b2b]/55 p-3 hover:border-[#e5b85c]/60"><p className="eyebrow">02 · Practice</p><p className="mt-1 text-sm text-[#f5f5f2]">{priority ? `Strengthen ${priorityLabels[priority]}` : "Mix every required skill"}</p></Link><Link href={due ? "/review" : "/practice?mode=weak"} className="rounded-xl border border-white/10 bg-[#101b2b]/55 p-3 hover:border-[#e5b85c]/60"><p className="eyebrow">03 · {due ? "Review" : "Repair"}</p><p className="mt-1 text-sm text-[#f5f5f2]">{due ? `${due} due item${due === 1 ? "" : "s"}` : "Return to what resisted"}</p></Link></div></div></section>;
}
