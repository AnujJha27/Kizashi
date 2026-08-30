"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useContentModule } from "@/components/content/use-content-module";
import { JapaneseText } from "@/components/learning/japanese-text";
import { readSavedSentences, toggleSavedSentence, type SavedSentence } from "@/lib/session";

export function SavedSentences() {
  const module = useContentModule();
  const [sentences, setSentences] = useState<SavedSentence[] | null>(null);

  useEffect(() => {
    const refresh = () => setSentences(readSavedSentences());
    refresh();
    window.addEventListener("michi-saved-sentences-updated", refresh);
    return () => window.removeEventListener("michi-saved-sentences-updated", refresh);
  }, []);

  if (!sentences?.length) return null;
  return <section className="surface-panel-raised mt-6 p-6"><div className="mb-4 flex items-end justify-between"><div><p className="eyebrow mb-2">Sentence bank · 文</p><h2 className="text-xl font-medium">Keep the lines that click.</h2></div><Link href="/practice" className="text-sm text-[#e5b85c] hover:text-[#f1cf7c]">Practice →</Link></div><div className="space-y-3">{sentences.map((sentence) => <article key={sentence.id} className="rounded-xl bg-[#101b2b]/70 p-4"><p className="jp-serif text-lg text-[#e5b85c]"><JapaneseText text={sentence.japanese} vocabulary={module.vocabulary} kanji={module.kanji} /></p><p className="mt-1 text-sm text-[#9297a1]">{sentence.translation}</p><div className="mt-3 flex flex-wrap gap-3 text-xs"><Link href={`/entry/${sentence.sourceItemId}`} className="font-semibold text-[#e5b85c] hover:text-[#f1cf7c]">Open source →</Link><button type="button" onClick={() => { toggleSavedSentence({ id: sentence.id, sourceItemId: sentence.sourceItemId, japanese: sentence.japanese, translation: sentence.translation }); window.dispatchEvent(new Event("michi-saved-sentences-updated")); }} className="text-[#9297a1] hover:text-[#f5f5f2]">Remove</button></div></article>)}</div></section>;
}
