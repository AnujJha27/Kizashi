"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useContentModule } from "@/components/content/use-content-module";
import { getDueReviewIds } from "@/lib/session";
import type { LessonContentItem } from "@/lib/curriculum";
import { LessonPlayer } from "@/components/learning/lesson-player";

const REVIEW_LIMIT = 20;

export function ReviewQueue({ items: _items }: Readonly<{ items: LessonContentItem[] }>) {
  const module = useContentModule();
  const catalog = useMemo(() => [...module.vocabulary, ...module.kanji, ...module.grammar, ...module.readings, ...module.listening], [module]);
  const [dueItems, setDueItems] = useState<LessonContentItem[] | null>(null);
  const vocabulary = module.vocabulary;
  const refresh = () => setDueItems(catalog.filter((item) => new Set(getDueReviewIds()).has(item.id)));

  useEffect(() => {
    refresh();
    window.addEventListener("michi-review-updated", refresh);
    return () => window.removeEventListener("michi-review-updated", refresh);
  }, [catalog]);

  if (dueItems === null) return <div className="min-h-80 animate-pulse rounded-xl bg-[#17181d]" aria-label="Loading review queue" />;

  if (!dueItems.length) return <div className="grid min-h-80 place-items-center rounded-xl border border-[#3f3427] bg-[#211d18] p-8 text-center"><div><p className="jp-serif text-5xl text-[#e5b85c]">ひと休み</p><p className="mt-4 text-sm leading-6 text-[#9297a1]">Nothing is due right now. Choose a new lesson or keep your skills warm with a short practice set.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/journey" className="rounded-xl bg-[#e34a3f] px-4 py-3 text-sm font-semibold text-[#0b0b0d] hover:bg-[#ef675d]">Choose next lesson <span className="ml-2" aria-hidden="true">→</span></Link><Link href="/practice?mode=mixed" className="rounded-xl border border-white/10 px-4 py-3 text-sm text-[#9297a1] hover:text-[#f5f5f2]">Practice mixed</Link></div></div></div>;

  const reviewItems = dueItems.slice(0, REVIEW_LIMIT);
  const batchId = reviewItems.map((item) => item.id).join(",");
  return <div><p className="mb-4 text-xs text-[#9297a1]">Reviewing {reviewItems.length} of {dueItems.length} due items · the rest will wait for the next small pass.</p><LessonPlayer key={batchId} lessonId={`review-queue:${batchId}`} items={reviewItems} contrasts={module.grammarContrasts} vocabulary={vocabulary} kanji={module.kanji} onComplete={refresh} /></div>;
}
