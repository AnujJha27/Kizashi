"use client";

import { useEffect, useState } from "react";

import { getCurrentRhythm, readStudyStats, type StudyStats } from "@/lib/session";

export function RhythmBadge() {
  const [stats, setStats] = useState<StudyStats | null>(null);

  useEffect(() => {
    const refresh = () => setStats(readStudyStats());
    refresh();
    window.addEventListener("michi-study-stats-updated", refresh);
    return () => window.removeEventListener("michi-study-stats-updated", refresh);
  }, []);

  if (!stats) return <div className="w-16" aria-hidden="true" />;
  return <div><p className="text-2xl font-semibold text-[#e5b85c]">{getCurrentRhythm(stats.activeDates)}</p><p className="mt-1 text-[10px] uppercase tracking-[.14em] text-[#676c75]">day rhythm</p></div>;
}
