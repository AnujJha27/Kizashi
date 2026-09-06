"use client";

import { useEffect, useMemo, useState } from "react";

import coverage from "@/data/lexical-coverage-union.json";
import kanjiStrokeData from "@/data/kanjivg-strokes.json";
import { getContentReviewStatus } from "@/lib/content-validation";
import { kanjiKey, vocabularyKey } from "@/lib/lexical-coverage-core.js";
import { readContentFlags } from "@/lib/content-flags.js";
import type { LessonContentItem } from "@/lib/curriculum";
import type { KanjiItem, N5Module } from "@/lib/types";

const levels = ["N5", "N4"] as const;
const kinds = ["vocabulary", "kanji"] as const;

function Status({ value }: Readonly<{ value: string }>) {
  const color =
    value === "covered"
      ? "text-[#8bcca6]"
      : value === "partial"
        ? "text-[#e5b85c]"
        : "text-[#ef675d]";
  return (
    <span className={`text-[10px] uppercase tracking-[.12em] ${color}`}>
      {value}
    </span>
  );
}

function keyFor(kind: (typeof kinds)[number], item: LessonContentItem) {
  if (kind === "vocabulary" && item.category === "vocabulary") return vocabularyKey(item.writtenForm, item.reading);
  if (kind === "kanji" && item.category === "kanji") return kanjiKey(item.character);
  return "";
}

function liveStats(kind: (typeof kinds)[number], level: (typeof levels)[number], records: typeof coverage.vocabulary.records, module: N5Module, flags: ReturnType<typeof readContentFlags>) {
  const items = (kind === "vocabulary" ? module.vocabulary : module.kanji).filter((item) => item.jlptLevel === level);
  const itemByKey = new Map(items.map((item) => [keyFor(kind, item), item]));
  const matched = records.filter((record) => record.level === level).flatMap((record) => {
    const item = itemByKey.get(record.key);
    return item ? [item] : [];
  });
  const usable = matched.filter((item) => getContentReviewStatus(item) !== "rejected");
  return {
    available: usable.length,
    reviewed: usable.filter((item) => getContentReviewStatus(item) === "approved" || flags[item.id]?.status === "reviewed").length,
    provisional: usable.filter((item) => getContentReviewStatus(item) === "pending").length,
    flagged: usable.filter((item) => flags[item.id]?.status === "flagged").length,
    usefulWords: kind === "kanji" ? usable.filter((item): item is KanjiItem => item.category === "kanji" && item.usefulWords.length > 0).length : 0,
    strokeData: kind === "kanji" ? usable.filter((item): item is KanjiItem => item.category === "kanji" && Boolean((kanjiStrokeData.characters as Record<string, unknown>)[item.character])).length : 0,
  };
}

function Panel({
  kind,
  label,
  module,
  flags,
}: Readonly<{ kind: (typeof kinds)[number]; label: string; module: N5Module; flags: ReturnType<typeof readContentFlags> }>) {
  const report = coverage[kind];
  return (
    <div className="rounded-lg border border-white/10 bg-[#101b2b]/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[#f5f5f2]">{label}</span>
        <span className="text-[10px] text-[#676c75]">
          {Object.values(report.summary).reduce(
            (total, row) => total + row.total,
            0,
          )}{" "}
          union records
        </span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {levels.map((level) => {
          const summary = report.summary[level];
          return (
            <div
              key={level}
              className="rounded-md border border-white/10 bg-[#17181d]/60 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[#f5f5f2]">{level}</span>
                <span className="text-[10px] text-[#9297a1]">
                  {summary.multiSource} multi-source
                </span>
              </div>
              {(() => { const stats = liveStats(kind, level, report.records, module, flags); return <><div className="mt-2 grid grid-cols-3 gap-2 text-center sm:grid-cols-5">
                <div>
                  <p className="text-lg text-[#8bcca6]">{summary.covered}</p>
                  <p className="text-[10px] text-[#676c75]">covered</p>
                </div>
                <div>
                  <p className="text-lg text-[#e5b85c]">{summary.partial}</p>
                  <p className="text-[10px] text-[#676c75]">partial</p>
                </div>
                <div>
                  <p className="text-lg text-[#ef675d]">{summary.missing}</p>
                  <p className="text-[10px] text-[#676c75]">missing</p>
                </div>
                <div><p className="text-lg text-[#f5f5f2]">{stats.available}</p><p className="text-[10px] text-[#676c75]">available</p></div>
                <div><p className="text-lg text-[#f5f5f2]">{stats.reviewed}</p><p className="text-[10px] text-[#676c75]">reviewed</p></div>
              </div>
              <p className="mt-2 text-[10px] leading-4 text-[#9297a1]">
                {summary.ambiguous} ambiguous · {summary.levelDisagreements}{" "}
                level disagreements
                {kind === "kanji"
                  ? ` · ${stats.provisional} provisional · ${stats.flagged} flagged · ${stats.usefulWords} with useful words · ${stats.strokeData} with stroke data`
                  : ` · ${stats.provisional} provisional · ${stats.flagged} flagged`}
              </p></>; })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewQueue({
  kind,
  level,
}: Readonly<{ kind: (typeof kinds)[number]; level: (typeof levels)[number] }>) {
  const report = coverage[kind];
  const rows = report.records
    .filter(
      (record) => record.level === level && record.coverageStatus !== "covered",
    )
    .slice(0, 8);
  const reviewCount =
    report.summary[level].partial + report.summary[level].missing;

  return (
    <div className="rounded-lg border border-white/10 bg-[#101b2b]/55 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#e5b85c]">
          {level} {kind} review
        </p>
        <span className="text-[10px] text-[#676c75]">
          Showing {rows.length} of {reviewCount}
        </span>
      </div>
      <div className="mt-2 space-y-2">
        {rows.map((record) => (
          <div
            key={record.id}
            className="rounded-md border border-white/10 bg-[#17181d]/65 p-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs text-[#f5f5f2]">
                {record.key}
              </span>
              <Status value={record.coverageStatus} />
            </div>
            <p className="mt-1 text-[10px] leading-4 text-[#9297a1]">
              {record.teachingStatus} ·{" "}
              {record.sourceIds.length
                ? record.sourceIds.join(" · ")
                : "no external source claim"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LexicalCoverage({ module }: Readonly<{ module: N5Module }>) {
  const [reviewVersion, setReviewVersion] = useState(0);
  useEffect(() => {
    const refresh = () => setReviewVersion((value) => value + 1);
    window.addEventListener("michi-content-flagged-updated", refresh);
    return () => window.removeEventListener("michi-content-flagged-updated", refresh);
  }, []);
  const flags = useMemo(() => {
    void reviewVersion;
    return readContentFlags();
  }, [reviewVersion]);
  const disagreements = kinds
    .flatMap((kind) =>
      coverage[kind].records
        .filter(
          (record) => record.levelDisagreement && record.levelClaims?.length,
        )
        .map((record) => ({ kind, record })),
    )
    .slice(0, 12);
  return (
    <section className="mb-7 rounded-xl border border-[#5d4c2c] bg-[#211d18]/55 p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="eyebrow">Vocabulary + kanji coverage union</p>
          <h2 className="mt-1 text-lg font-medium text-[#f5f5f2]">
            Coverage evidence, not a release claim.
          </h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-[#9297a1]">
            OpenJLPT, Irodori, Marugoto, and the staged Kizashi package are
            clustered by normalized form. Released records are covered; staged
            records remain partial until reviewed and taught.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-[.12em] text-[#676c75]">
          Generated {coverage.generatedAt}
        </span>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {kinds.map((kind) => (
          <Panel
            key={kind}
            kind={kind}
            label={kind === "vocabulary" ? "Vocabulary" : "Kanji"}
            module={module}
            flags={flags}
          />
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {kinds.flatMap((kind) =>
          levels.map((level) => (
            <ReviewQueue key={kind + "-" + level} kind={kind} level={level} />
          )),
        )}
      </div>
      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#e5b85c]">
          Level disagreement queue
        </p>
        <p className="mt-1 text-[10px] leading-4 text-[#9297a1]">
          These claims stay visible for review instead of being flattened into
          one mysterious JLPT level.
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {disagreements.map(({ kind, record }) => (
            <div
              key={record.id}
              className="rounded-md border border-white/10 bg-[#101b2b]/60 p-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-[#f5f5f2]">
                  {record.key}
                </span>
                <span className="shrink-0 text-[10px] uppercase text-[#ef675d]">
                  {kind}
                </span>
              </div>
              <p className="mt-1 text-[10px] leading-4 text-[#9297a1]">
                {(record.levelClaims ?? [])
                  .map((claim) => `${claim.sourceId}: ${claim.level}`)
                  .join(" · ")}
              </p>
            </div>
          ))}
        </div>
        {disagreements.length ? (
          <p className="mt-2 text-[10px] text-[#676c75]">
            Showing {disagreements.length} review examples; aggregate
            disagreement counts remain above.
          </p>
        ) : null}
      </div>
      <p className="mt-4 border-t border-white/10 pt-3 text-[10px] leading-4 text-[#676c75]">
        Sources: {coverage.sources.vocabulary.openjlpt} OpenJLPT vocabulary
        rows, {coverage.sources.vocabulary.irodori} Irodori rows,{" "}
        {coverage.sources.vocabulary.marugoto} Marugoto rows, and{" "}
        {coverage.sources.kanji.openjlpt} OpenJLPT kanji rows. Level
        disagreements and ambiguity stay review-visible. The bounded queues
        above expose record-level status and source evidence for review.
      </p>
    </section>
  );
}
