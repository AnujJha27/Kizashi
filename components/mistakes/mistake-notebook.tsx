"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useContentModule } from "@/components/content/use-content-module";
import { JapaneseText } from "@/components/learning/japanese-text";
import { getIjasWarning } from "@/lib/ijas-core.js";
import type { LessonContentItem } from "@/lib/curriculum";
import { getDueRepairs } from "@/lib/repair-core.js";
import { readMistakes, readRepairRecords, type MistakeRecord, type RepairRecord } from "@/lib/session";
import type { GrammarContrast, KanjiItem, VocabularyItem } from "@/lib/types";

function Detail({ item, vocabulary, kanji }: Readonly<{ item: LessonContentItem; vocabulary: VocabularyItem[]; kanji: KanjiItem[] }>) {
  if (item.category === "vocabulary") return <><JapaneseText text={item.writtenForm} vocabulary={vocabulary} kanji={kanji} inspect={false} /> · {item.reading} · {item.meanings.join(" / ")}</>;
  if (item.category === "kanji") return <><JapaneseText text={item.character} vocabulary={vocabulary} kanji={kanji} inspect={false} /> · {item.meanings.join(" / ")}</>;
  if (item.category === "grammar") return <><JapaneseText text={item.pattern} vocabulary={vocabulary} kanji={kanji} inspect={false} /> · {item.meaning}</>;
  return <JapaneseText text={item.title} vocabulary={vocabulary} kanji={kanji} always inspect={false} />;
}

function repairAction(record: MistakeRecord) {
  const type = record.lastQuestionType ?? "";
  if (/listening|audio/iu.test(type)) return { label: "Listening repair", href: "/immersion" };
  if (/reading/iu.test(type)) return { label: "Reading repair", href: "/immersion" };
  if (/kanji|orthography/iu.test(type)) return { label: "Kanji repair", href: "/practice?mode=kanji" };
  if (/grammar|particle|conjug/iu.test(type)) return { label: "Grammar repair", href: "/practice?mode=grammar" };
  return { label: "Focused repair", href: "/practice?mode=weak" };
}

export function MistakeNotebook({ items: _items, grammarContrasts }: Readonly<{ items: LessonContentItem[]; grammarContrasts: GrammarContrast[] }>) {
  const module = useContentModule();
  const catalog = [...module.vocabulary, ...module.kanji, ...module.grammar, ...module.readings, ...module.listening];
  const [mistakes, setMistakes] = useState<Record<string, MistakeRecord> | null>(null);
  const [repairs, setRepairs] = useState<RepairRecord[]>([]);

  useEffect(() => {
    const refresh = () => { setMistakes(readMistakes()); setRepairs(readRepairRecords()); };
    refresh();
    window.addEventListener("michi-review-updated", refresh);
    window.addEventListener("michi-mistakes-updated", refresh);
    window.addEventListener("michi-repair-updated", refresh);
    return () => { window.removeEventListener("michi-review-updated", refresh); window.removeEventListener("michi-mistakes-updated", refresh); window.removeEventListener("michi-repair-updated", refresh); };
  }, []);

  if (!mistakes) return <div className="min-h-64 animate-pulse rounded-xl bg-[#17181d]" aria-label="Loading mistakes" />;
  const entries = catalog.filter((item) => mistakes[item.id]).sort((left, right) => mistakes[right.id].count - mistakes[left.id].count);

  if (!entries.length) return <section className="surface-panel p-8 text-center"><p className="jp-serif text-3xl text-[#e5b85c]">まだ大丈夫</p><h2 className="mt-3 text-xl font-medium">Nothing troublesome yet.</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#9297a1]">Your recurring mistakes will appear here as you study. A wrong answer is just a signpost.</p><Link href="/practice" className="mt-6 inline-flex rounded-xl bg-[#e34a3f] px-4 py-3 text-sm font-semibold text-[#0b0b0d] hover:bg-[#ef675d]">Start practice <span className="ml-2" aria-hidden="true">→</span></Link></section>;

  const contrasts = module.grammarContrasts.length ? module.grammarContrasts : grammarContrasts;
  const contrastRepairs = contrasts.map((contrast) => ({ contrast, misses: contrast.grammarPointIds.reduce((total, id) => total + (mistakes[id]?.count ?? 0), 0) })).filter(({ misses }) => misses > 0).sort((left, right) => right.misses - left.misses);
  const dueRepairs = getDueRepairs(repairs);
  return <div className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow mb-2">Repair center · 弱点</p><h2 className="text-xl font-medium">The places asking for another look.</h2><p className="mt-1 text-sm text-[#9297a1]">Each miss points to the kind of practice that can repair it.</p></div><Link href="/practice?mode=weak" className="rounded-xl bg-[#e34a3f] px-4 py-3 text-sm font-semibold text-[#0b0b0d] hover:bg-[#ef675d]">Fix weak areas <span aria-hidden="true">→</span></Link></div>{dueRepairs.length ? <section className="rounded-xl border border-[#e5b85c]/50 bg-[#2a2117]/60 p-4"><p className="eyebrow">Due repairs · もう一度</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{dueRepairs.slice(0, 4).map((repair) => <Link key={repair.id} href={`/practice?mode=weak&repair=${encodeURIComponent(repair.questionId)}`} className="rounded-lg border border-[#5d4c2c] bg-[#17181d]/70 p-3 hover:border-[#e5b85c]"><p className="text-sm font-medium text-[#f5f5f2]">{repair.card?.example ?? "Concept repair"}</p><p className="mt-1 text-xs text-[#e5b85c]">Open repair →</p></Link>)}</div></section> : null}{contrastRepairs.length ? <section className="rounded-xl border border-[#6e5220]/70 bg-[#2a2117]/60 p-4"><p className="eyebrow">Grammar contrasts · 文法の違い</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{contrastRepairs.map(({ contrast, misses }) => <Link key={contrast.id} href={`/practice?mode=weak&focus=${contrast.id}`} className="rounded-lg border border-[#5d3936] bg-[#17181d]/70 p-3 hover:border-[#e5b85c]"><p className="text-sm font-medium text-[#f5f5f2]">{contrast.title}</p><p className="mt-1 text-xs text-[#9297a1]">{misses} related miss{misses === 1 ? "" : "es"} · repair contrast <span aria-hidden="true">→</span></p></Link>)}</div></section> : null}{entries.map((item) => { const record = mistakes[item.id]; const focus = record.lastQuestionType ? record.lastQuestionType : "active recall"; const patterns = Object.entries(record.questionTypes ?? {}).sort((left, right) => right[1] - left[1]).slice(0, 2).map(([type, count]) => `${type} ×${count}`).join(" · "); const warning = getIjasWarning(item, record, module.learnerErrorAggregates); const action = repairAction(record); return <article key={item.id} className="flex flex-col gap-3 rounded-xl border border-[#713b37]/70 bg-[#21191a]/65 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="eyebrow mb-2">{item.category} · {focus}</p><Link href={`/entry/${item.id}`} className="jp-serif mt-1 block text-xl text-[#f5f5f2] hover:text-[#e5b85c]"><Detail item={item} vocabulary={module.vocabulary} kanji={module.kanji} /></Link>{patterns ? <p className="mt-2 text-xs text-[#9297a1]">Patterns: {patterns}</p> : null}{warning ? <p className="mt-3 rounded-lg border border-[#6e5220]/70 bg-[#2a2117]/70 p-3 text-xs leading-5 text-[#e5b85c]"><span className="block text-[10px] font-semibold tracking-[.12em]">{warning.label} · {warning.category}</span>{warning.message}</p> : null}</div><div className="flex items-center gap-3"><Link href={action.href} className="text-xs font-semibold text-[#e5b85c] hover:text-[#f1cf7c]">{action.label} →</Link><span className="rounded-full border border-[#5d3936] px-3 py-1 text-xs text-[#e5b85c]">{record.count} again{record.count === 1 ? "" : "s"}</span></div></article>; })}</div>;
}
