import { LibraryBrowser } from "@/components/library/library-browser";
import { n5Module } from "@/lib/curriculum";
import { SavedSentences } from "@/components/library/saved-sentences";
import { QuickAdd } from "@/components/library/quick-add";

export const metadata = { title: "Library" };

const libraryFilters = ["all", "new", "weak", "learned", "queue", "N5", "N4", "vocabulary", "kanji", "reading", "listening", "grammar"] as const;

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const items = [...n5Module.vocabulary, ...n5Module.kanji, ...n5Module.grammar, ...n5Module.readings, ...n5Module.listening];
  const initialFilter = libraryFilters.includes(filter as (typeof libraryFilters)[number]) ? filter as (typeof libraryFilters)[number] : "all";

  return <div className="mx-auto max-w-6xl"><div className="mb-8"><p className="eyebrow mb-3">Library · N5 Foundations</p><h1 className="jp-serif text-3xl tracking-tight text-[#f5f5f2] sm:text-4xl">Keep useful words close.</h1><p className="mt-2 max-w-xl text-sm text-[#9297a1]">Search the things you have met so far. Each entry is connected to context, not just a translation.</p></div><section className="surface-panel overflow-hidden p-7 sm:p-10"><QuickAdd canonicalItems={n5Module.vocabulary} /><LibraryBrowser items={items} initialFilter={initialFilter} /></section><SavedSentences /></div>;
}
