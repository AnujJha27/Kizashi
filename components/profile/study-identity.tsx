"use client";

import { useEffect, useState } from "react";

import { getCurrentRhythm, readReviewRecords, readStudyStats, type StudyStats } from "@/lib/session";
import { StudyPortrait } from "@/components/profile/study-portrait";

const titles = ["New traveler", "First-step learner", "Kotoba traveler", "Quietly relentless"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function StudyIdentity() {
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [reviewed, setReviewed] = useState(0);

  useEffect(() => {
    const refresh = () => { setStats(readStudyStats()); setReviewed(Object.keys(readReviewRecords()).length); };
    refresh();
    window.addEventListener("michi-review-updated", refresh);
    window.addEventListener("michi-study-stats-updated", refresh);
    return () => { window.removeEventListener("michi-review-updated", refresh); window.removeEventListener("michi-study-stats-updated", refresh); };
  }, []);

  if (!stats) return <div className="h-36 animate-pulse rounded-2xl bg-[#17181d]" aria-label="Loading study identity" />;
  const level = Math.floor(stats.xp / 100) + 1;
  const title = titles[Math.min(Math.floor((level - 1) / 3), titles.length - 1)];
  const rhythm = getCurrentRhythm(stats.activeDates);
  const totalMinutes = Object.values(stats.minutesByDate ?? {}).reduce((sum, minutes) => sum + minutes, 0);
  const studyTime = totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h` : `${totalMinutes}m`;

  const achievements = [{ title: "はじめの一歩", detail: "Meet your first concept", earned: reviewed >= 1 }, { title: "言葉の旅人", detail: "Meet 25 concepts", earned: reviewed >= 25 }, { title: "七日間", detail: "Build a seven-day rhythm", earned: rhythm >= 7 }, { title: "合格への道", detail: "Earn 500 XP", earned: stats.xp >= 500 }];
  const activeDates = new Set(stats.activeDates);
  const heatmap = Array.from({ length: 28 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (27 - index)); return { key: dateKey(date), label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) }; });
  return <section className="surface-panel overflow-hidden p-6 sm:p-8"><div className="grid gap-6 lg:grid-cols-[.95fr_1.05fr] lg:items-start"><div><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="eyebrow mb-2">Your character · 自分</p><h2 className="jp-serif text-3xl text-[#f5f5f2]">{title}</h2><p className="mt-1 text-sm text-[#9297a1]">Level {level} · Japanese learner · {reviewed} concepts met</p></div><div className="flex flex-wrap gap-x-6 gap-y-3"><div><p className="text-2xl font-semibold text-[#e5b85c]">{stats.xp}</p><p className="text-[10px] uppercase tracking-[.14em] text-[#676c75]">XP</p></div><div><p className="text-2xl font-semibold text-[#e34a3f]">{rhythm}</p><p className="text-[10px] uppercase tracking-[.14em] text-[#676c75]">rhythm</p></div><div><p className="text-2xl font-semibold text-[#6fb98f]">{stats.bestRhythm}</p><p className="text-[10px] uppercase tracking-[.14em] text-[#676c75]">best</p></div><div><p className="text-2xl font-semibold text-[#8cc9e5]">{studyTime}</p><p className="text-[10px] uppercase tracking-[.14em] text-[#676c75]">study time</p></div></div></div><div className="mt-6 h-2 overflow-hidden rounded-full bg-[#292b31]"><div className="h-full rounded-full bg-gradient-to-r from-[#e34a3f] via-[#e5b85c] to-[#6fb98f]" style={{ width: `${stats.xp % 100}%` }} /></div><p className="mt-2 text-xs text-[#9297a1]">{100 - (stats.xp % 100)} XP to level {level + 1}</p><div className="mt-6"><div className="mb-3 flex max-w-xs items-center justify-between"><p className="eyebrow">Recent rhythm</p><p className="text-xs text-[#676c75]">last 28 days</p></div><div className="grid max-w-xs grid-cols-7 gap-1.5" aria-label="Study activity over the last 28 days">{heatmap.map((date) => <span key={date.key} title={date.label} className={`size-7 rounded-sm ${activeDates.has(date.key) ? "bg-[#e5b85c]" : "bg-[#242a31]"}`} />)}</div></div></div><StudyPortrait level={level} rhythm={rhythm} /></div><div className="mt-6 border-t border-[#292b31] pt-5"><p className="eyebrow mb-3">Achievements · 実績</p><div className="grid gap-2 sm:grid-cols-4">{achievements.map((achievement) => <div key={achievement.title} className={`rounded-xl border p-3 ${achievement.earned ? "border-[#4b3a29] bg-[#211d18]" : "border-white/10 bg-[#101b2b]/45 opacity-50"}`}><p className={`jp-serif text-sm ${achievement.earned ? "text-[#e5b85c]" : "text-[#676c75]"}`}>{achievement.earned ? "✦ " : "○ "}{achievement.title}</p><p className="mt-2 text-[11px] leading-5 text-[#9297a1]">{achievement.detail}</p></div>)}</div></div></section>;
}
