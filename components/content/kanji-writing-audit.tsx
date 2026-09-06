"use client";

import kanjiStrokeData from "@/data/kanjivg-strokes.json";
import { normalizeStrokeData } from "@/lib/kanji-writing-core.js";
import type { N5Module } from "@/lib/types";

export function KanjiWritingAudit({ module }: Readonly<{ module: N5Module }>) {
  const manifest = kanjiStrokeData as { source?: string; license?: string; version?: string; characters: Record<string, unknown> };
  const records = manifest.characters;
  const levels = (["N5", "N4"] as const).map((level) => {
    const items = module.kanji.filter((item) => item.jlptLevel === level);
    const withStrokeData = items.filter((item) => normalizeStrokeData(records[item.character]));
    const missing = items.filter((item) => !withStrokeData.includes(item)).map((item) => item.character);
    const mismatches = items.filter((item) => {
      const record = normalizeStrokeData(records[item.character]);
      return record && Number.isInteger(item.strokeCount) && record.strokes.length !== item.strokeCount;
    }).map((item) => item.character);
    return { level, total: items.length, covered: withStrokeData.length, enabled: withStrokeData.length, missing, mismatches };
  });
  return <section className="rounded-xl border border-[#3f3427] bg-[#211d18]/55 p-4 sm:p-5"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="eyebrow">Kanji writing data</p><h2 className="mt-1 text-lg font-medium text-[#f5f5f2]">Stroke-order coverage by level.</h2><p className="mt-1 text-xs leading-5 text-[#9297a1]">Counts use the local KanjiVG manifest; missing records and stroke-count mismatches stay visible and are not fabricated.</p></div><span className="text-right text-[10px] uppercase tracking-[.12em] text-[#676c75]">{manifest.source} · {manifest.version}<br />{manifest.license}</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{levels.map((entry) => <div key={entry.level} className="rounded-lg border border-white/10 bg-[#17181d]/65 p-3"><p className="text-xs text-[#f5f5f2]">{entry.level} · {entry.covered} / {entry.total} with stroke paths</p><p className="mt-1 text-[10px] text-[#9297a1]">{entry.enabled} writing practice enabled · {entry.mismatches.length} stroke-count mismatch</p>{entry.missing.length ? <p className="mt-1 truncate text-[10px] text-[#e5b85c]" title={entry.missing.join(" ")}>Without stroke data: {entry.missing.join(" ")}</p> : <p className="mt-1 text-[10px] text-[#8bcca6]">All current records have local paths.</p>}{entry.mismatches.length ? <p className="mt-1 truncate text-[10px] text-[#ef675d]" title={entry.mismatches.join(" ")}>Mismatch: {entry.mismatches.join(" ")}</p> : null}</div>)}</div></section>;
}
