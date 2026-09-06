"use client";

import kanjiStrokeData from "@/data/kanjivg-strokes.json";
import type { N5Module } from "@/lib/types";

export function KanjiWritingAudit({ module }: Readonly<{ module: N5Module }>) {
  const records = kanjiStrokeData.characters as Record<string, unknown>;
  const levels = (["N5", "N4"] as const).map((level) => {
    const items = module.kanji.filter((item) => item.jlptLevel === level);
    const missing = items.filter((item) => !records[item.character]).map((item) => item.character);
    return { level, total: items.length, covered: items.length - missing.length, missing };
  });
  return <section className="rounded-xl border border-[#3f3427] bg-[#211d18]/55 p-4 sm:p-5"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="eyebrow">Kanji writing data</p><h2 className="mt-1 text-lg font-medium text-[#f5f5f2]">Stroke-order coverage by level.</h2><p className="mt-1 text-xs leading-5 text-[#9297a1]">Counts use the local KanjiVG manifest; missing records stay visible and are not fabricated.</p></div><span className="text-[10px] uppercase tracking-[.12em] text-[#676c75]">Studio audit</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{levels.map((entry) => <div key={entry.level} className="rounded-lg border border-white/10 bg-[#17181d]/65 p-3"><p className="text-xs text-[#f5f5f2]">{entry.level} · {entry.covered} / {entry.total} with stroke paths</p>{entry.missing.length ? <p className="mt-1 truncate text-[10px] text-[#e5b85c]" title={entry.missing.join(" ")}>Missing: {entry.missing.join(" ")}</p> : <p className="mt-1 text-[10px] text-[#8bcca6]">All current records have local paths.</p>}</div>)}</div></section>;
}
