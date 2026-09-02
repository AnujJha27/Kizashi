import Link from "next/link";

import { LibraryBrowser } from "@/components/library/library-browser";
import { n5Module } from "@/lib/curriculum";
import { SavedSentences } from "@/components/library/saved-sentences";
import { QuickAdd } from "@/components/library/quick-add";

export const metadata = { title: "Library" };

const libraryFilters = ["all", "new", "weak", "learned", "queue", "N5", "N4", "vocabulary", "kanji", "reading", "listening", "grammar"] as const;

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ filter?: string; query?: string }> }) {
  const { filter, query } = await searchParams;
  const items = [...n5Module.vocabulary, ...n5Module.kanji, ...n5Module.grammar, ...n5Module.readings, ...n5Module.listening];
  const initialFilter = libraryFilters.includes(filter as (typeof libraryFilters)[number]) ? filter as (typeof libraryFilters)[number] : "all";

  return <div className="mx-auto max-w-6xl"><div className="mb-8"><p className="eyebrow mb-3">Library · N5 Foundations</p><h1 className="jp-serif text-3xl tracking-tight text-[#f5f5f2] sm:text-4xl">Keep useful words close.</h1><p className="mt-2 max-w-xl text-sm text-[#9297a1]">Search the things you have met so far. Each entry is connected to context, not just a translation.</p><nav aria-label="Library areas" className="mt-5 flex flex-wrap gap-2 text-xs"><Link href="/books" className="rounded-lg border border-[#3f4652] px-3 py-2 text-[#c3c7ce] hover:border-[#e5b85c]">Books →</Link><Link href="/reference" className="rounded-lg border border-[#3f4652] px-3 py-2 text-[#c3c7ce] hover:border-[#e5b85c]">Reference →</Link><Link href="#saved-sentences" className="rounded-lg border border-[#3f4652] px-3 py-2 text-[#c3c7ce] hover:border-[#e5b85c]">Saved sentences ↓</Link></nav></div><section className="surface-panel overflow-hidden p-7 sm:p-10"><QuickAdd canonicalItems={n5Module.vocabulary} /><LibraryBrowser items={items} initialFilter={initialFilter} initialQuery={query ?? ""} /></section><div id="saved-sentences"><SavedSentences /></div></div>;
}
