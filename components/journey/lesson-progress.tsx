"use client";

import { useEffect, useState } from "react";

import { readReviewRecords } from "@/lib/session";

export function LessonProgress({ itemIds }: Readonly<{ itemIds: string[] }>) {
  const [progress, setProgress] = useState({ seen: 0, held: 0 });

  useEffect(() => {
    const refresh = () => {
      const records = readReviewRecords();
      setProgress({
        seen: itemIds.filter((id) => records[id]).length,
        held: itemIds.filter((id) => records[id]?.masteryState === "stable" || records[id]?.masteryState === "strong" || (records[id]?.streak ?? 0) >= 2).length,
      });
    };
    refresh();
    window.addEventListener("michi-review-updated", refresh);
    return () => window.removeEventListener("michi-review-updated", refresh);
  }, [itemIds]);

  const seenPercent = Math.round((progress.seen / Math.max(itemIds.length, 1)) * 100);
  const heldPercent = Math.round((progress.held / Math.max(itemIds.length, 1)) * 100);

  return <div className="mt-6 space-y-3"><div><div className="mb-2 flex justify-between text-xs text-[#676c75]"><span>Introduced</span><span>{progress.seen} / {itemIds.length} · {seenPercent}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#292b31]"><div className="h-full rounded-full bg-[#e34a3f] transition-[width] duration-300" style={{ width: `${seenPercent}%` }} /></div></div><div><div className="mb-2 flex justify-between text-xs text-[#676c75]"><span>Held</span><span>{progress.held} / {itemIds.length} · {heldPercent}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#292b31]"><div className="h-full rounded-full bg-[#6fb98f] transition-[width] duration-300" style={{ width: `${heldPercent}%` }} /></div></div></div>;
}
