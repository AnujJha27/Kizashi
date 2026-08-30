"use client";

import Link from "next/link";

import { getValidatedPracticeQuestions } from "@/lib/questions";
import { getTopicItemIds, type LessonContentItem } from "@/lib/curriculum";
import { getCurriculumBand } from "@/lib/jlpt";
import type { N5Module } from "@/lib/types";

const topics = [
  ["people", "People", "人"],
  ["study", "Study", "学び"],
  ["time", "Time & calendar", "時間"],
  ["food", "Food", "食べ物"],
  ["home", "Home", "家"],
  ["transport", "Transport", "交通"],
  ["places", "Places", "場所"],
  ["health", "Health", "健康"],
  ["school", "School", "学校"],
  ["hobbies", "Hobbies", "趣味"],
  ["seasons", "Seasons", "季節"],
  ["weather", "Weather", "天気"],
  ["shopping", "Shopping", "買い物"],
  ["daily-life", "Daily life", "毎日"],
  ["conversation", "Conversation & plans", "会話"],
  ["directions", "Directions", "道"],
] as const;

export function TopicCoverage({ module }: Readonly<{ module: N5Module }>) {
  const items = [...module.vocabulary, ...module.kanji, ...module.grammar, ...module.readings, ...module.listening];
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const practiceQuestions = getValidatedPracticeQuestions(module);
  const bandCounts = items.reduce((counts, item) => ({ ...counts, [getCurriculumBand(item)]: counts[getCurriculumBand(item)] + 1 }), { core: 0, extended: 0, bridge: 0 });
  const coverage = topics.map(([id, label, jp]) => {
    const ids = { vocabulary: new Set<string>(), kanji: new Set<string>(), grammar: new Set<string>(), reading: new Set<string>(), listening: new Set<string>(), practice: new Set<string>() };
    const topicItemIds = getTopicItemIds(items, id);
    items.forEach((item) => {
      if (!topicItemIds.has(item.id)) return;
      ids[item.category].add(item.id);
    });
    practiceQuestions.forEach((question) => {
      const item = itemsById.get(question.itemId);
      if (item && topicItemIds.has(item.id)) ids.practice.add(question.id);
    });
    const counts = { vocabulary: ids.vocabulary.size, kanji: ids.kanji.size, grammar: ids.grammar.size, reading: ids.reading.size, listening: ids.listening.size, practice: ids.practice.size };
    const gaps = (["vocabulary", "kanji", "grammar", "reading", "listening", "practice"] as const).filter((key) => !counts[key]);
    const bands = new Set([...topicItemIds].map((itemId) => itemsById.get(itemId)).filter((item): item is LessonContentItem => Boolean(item)).map(getCurriculumBand));
    const bandGaps = (["core", "extended", "bridge"] as const).filter((band) => !bands.has(band));
    return { id, label, jp, counts, gaps, bandGaps, ready: gaps.length === 0 };
  });

  const labels = { vocabulary: "words", kanji: "kanji", grammar: "grammar", reading: "reading", listening: "listening", practice: "drills" } as const;
  return <section className="rounded-xl border border-white/10 bg-[#101b2b]/55 p-5 sm:p-6"><div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Topic coverage · 話題</p><h2 className="mt-1 text-xl font-medium text-[#f5f5f2]">Is each topic actually teachable?</h2><p className="mt-1 text-sm text-[#9297a1]">Ready means the topic has vocabulary, kanji, grammar, both context modes, and reusable practice.</p></div><span className="text-xs text-[#676c75]">Linked context counts too</span></div><div className="mb-5 grid grid-cols-3 gap-2">{(["core", "extended", "bridge"] as const).map((band) => <div key={band} className="rounded-lg border border-white/10 bg-[#17181d]/65 px-3 py-2"><div className="flex items-center justify-between gap-2"><span className="text-[10px] uppercase tracking-[.12em] text-[#e5b85c]">{band}</span><span className="text-sm font-medium text-[#f5f5f2]">{bandCounts[band]}</span></div><p className="mt-1 text-[10px] text-[#676c75]">{Math.round((bandCounts[band] / Math.max(items.length, 1)) * 100)}% of path</p></div>)}</div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{coverage.map(({ id, label, jp, counts, gaps, bandGaps, ready }) => <article key={id} className="rounded-lg border border-white/10 bg-[#17181d]/65 p-3"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-medium text-[#f5f5f2]">{label}</h3><p className="jp-serif text-xs text-[#e5b85c]">{jp}</p></div><span className={`text-[10px] uppercase tracking-[.12em] ${ready ? "text-[#6fb98f]" : "text-[#e5b85c]"}`}>{ready ? "Ready" : `${gaps.length} gaps`}</span></div><div className="mt-3 grid grid-cols-3 gap-1 text-center text-[10px] text-[#9297a1]">{(Object.keys(labels) as (keyof typeof labels)[]).map((key) => <span key={key} className="rounded bg-[#102536] px-1 py-1.5"><b className="block text-sm font-medium text-[#f5f5f2]">{counts[key]}</b>{labels[key]}</span>)}</div>{gaps.length ? <p className="mt-3 text-[10px] leading-4 text-[#e5b85c]">Add: {gaps.map((gap) => labels[gap]).join(" · ")}</p> : <p className="mt-3 text-[10px] leading-4 text-[#6fb98f]">All core study supports are present.</p>}{bandGaps.length ? <p className="mt-2 text-[10px] leading-4 text-[#9297a1]">Band gaps: {bandGaps.join(" · ")}</p> : null}<Link href={`/practice?mode=mixed&topic=${encodeURIComponent(id)}`} className="mt-3 inline-flex text-xs font-semibold text-[#e5b85c] hover:text-[#f1cf7c]">Practice this topic →</Link></article>)}</div></section>;
}
