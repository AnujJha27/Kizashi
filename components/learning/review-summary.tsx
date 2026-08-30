"use client";

import { useEffect, useState } from "react";

import { useLocalItems } from "@/components/content/use-local-items";
import type { LessonContentItem } from "@/lib/curriculum";
import { getDueReviewIds } from "@/lib/session";

const categories: LessonContentItem["category"][] = ["vocabulary", "kanji", "grammar", "reading", "listening"];
const labels: Record<LessonContentItem["category"], string> = { vocabulary: "Vocabulary", kanji: "Kanji", grammar: "Grammar", reading: "Reading", listening: "Listening" };

export function ReviewSummary({ items }: Readonly<{ items: LessonContentItem[] }>) {
  const catalog = useLocalItems(items);
  const [dueIds, setDueIds] = useState<string[] | null>(null);

  useEffect(() => {
    const refresh = () => setDueIds(getDueReviewIds());
    refresh();
    window.addEventListener("michi-review-updated", refresh);
    return () => window.removeEventListener("michi-review-updated", refresh);
  }, []);

  if (!dueIds) return <div className="mb-6 h-20 animate-pulse rounded-xl bg-[#17181d]" aria-label="Loading review summary" />;
  const due = new Set(dueIds);

  const total = catalog.filter((item) => due.has(item.id)).length;
  return <div className="mb-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">{categories.map((category) => { const count = catalog.filter((item) => item.category === category && due.has(item.id)).length; return <div key={category} className="rounded-xl border border-white/10 bg-[#101b2b]/70 p-3"><p className="text-xs text-[#9297a1]">{labels[category]}</p><p className={`mt-1 text-xl font-semibold ${count ? "text-[#e5b85c]" : "text-[#676c75]"}`}>{count}</p></div>; })}<div className="rounded-xl border border-[#4b3a29] bg-[#211d18]/70 p-3"><p className="text-xs text-[#9297a1]">Total</p><p className={`mt-1 text-xl font-semibold ${total ? "text-[#e34a3f]" : "text-[#676c75]"}`}>{total}</p></div></div>;
}
