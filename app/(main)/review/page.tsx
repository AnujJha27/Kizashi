import { ReviewQueue } from "@/components/learning/review-queue";
import { ReviewSummary } from "@/components/learning/review-summary";
import { n5Module } from "@/lib/curriculum";

export const metadata = { title: "Review" };

export default function ReviewPage() {
  const items = [...n5Module.vocabulary, ...n5Module.kanji, ...n5Module.grammar, ...n5Module.readings, ...n5Module.listening];

  return <div className="mx-auto max-w-5xl"><div className="mb-8"><p className="eyebrow mb-3">Review · spaced practice</p><h1 className="jp-serif text-3xl tracking-tight text-[#f5f5f2] sm:text-4xl">Review when it matters.</h1><p className="mt-2 max-w-xl text-sm text-[#9297a1]">Weak items return on a small, forgiving rhythm instead of disappearing after one good answer.</p></div><ReviewSummary items={items} /><section className="surface-panel overflow-hidden p-7 sm:p-10"><ReviewQueue items={items} /></section></div>;
}
