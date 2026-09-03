"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useLocalItems } from "@/components/content/use-local-items";
import { getTopicCoverage, topicLabel, type LessonContentItem } from "@/lib/curriculum";
import { getCurriculumBand, getN5Readiness, n5ExamRequirements } from "@/lib/jlpt";
import { getDueReviewIds, readExamAttempts, readMistakes, readReviewRecords, type ExamAttempt, type ReviewRecord } from "@/lib/session";
import { KnowledgeMap } from "@/components/progress/knowledge-map";
import { JapaneseText } from "@/components/learning/japanese-text";
import type { KanjiItem, VocabularyItem } from "@/lib/types";

const categories: LessonContentItem["category"][] = ["vocabulary", "kanji", "grammar", "reading", "listening"];
const bands = ["core", "extended", "bridge"] as const;

function label(category: LessonContentItem["category"]) {
  return { vocabulary: "Vocabulary", kanji: "Kanji", grammar: "Grammar", reading: "Reading", listening: "Listening" }[category];
}

function statusLabel(status: string) {
  return { untested: "Untested", weak: "Weak", developing: "Developing", "exam-ready": "Exam-ready", strong: "Strong" }[status] ?? status;
}

function coverageLabel(count: number, total: number) {
  const ratio = count / Math.max(total, 1);
  return ratio === 0 ? "Not started" : ratio >= 0.7 ? "Building strength" : "Developing";
}

const practiceModes: Record<LessonContentItem["category"], string> = { vocabulary: "vocabulary", kanji: "kanji", grammar: "grammar", reading: "reading", listening: "listening" };

export function ProgressDashboard({ items }: Readonly<{ items: LessonContentItem[] }>) {
  const catalog = useLocalItems(items);
  const [records, setRecords] = useState<Record<string, ReviewRecord> | null>(null);
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[] | null>(null);

  useEffect(() => {
    const refresh = () => { setRecords(readReviewRecords()); setExamAttempts(readExamAttempts()); };
    refresh();
    window.addEventListener("michi-review-updated", refresh);
    window.addEventListener("michi-exam-attempt-updated", refresh);
    return () => { window.removeEventListener("michi-review-updated", refresh); window.removeEventListener("michi-exam-attempt-updated", refresh); };
  }, []);

  if (records === null || examAttempts === null) return <div className="min-h-80 animate-pulse rounded-xl bg-[#17181d]" aria-label="Loading progress" />;

  const reviewedIds = new Set(Object.keys(records));
  const reviewed = catalog.filter((item) => reviewedIds.has(item.id)).length;
  const mastered = catalog.filter((item) => (records[item.id]?.streak ?? 0) >= 2).length;
  const learning = Math.max(reviewed - mastered, 0);
  const mistakes = readMistakes();
  const weak = catalog.filter((item) => Boolean(mistakes[item.id]) || Boolean(records[item.id] && ((records[item.id].incorrectCount ?? 0) > 0 || records[item.id].correct / Math.max(records[item.id].attempts, 1) < 0.75))).length;
  const due = getDueReviewIds().length;
  const recurring = catalog.filter((item) => mistakes[item.id]).sort((left, right) => mistakes[right.id].count - mistakes[left.id].count).slice(0, 4);
  const summary = getN5Readiness(catalog, records, examAttempts);
  const topicCoverage = getTopicCoverage(catalog, records).sort((left, right) => (left.held / Math.max(left.total, 1)) - (right.held / Math.max(right.total, 1)) || right.total - left.total).slice(0, 8);
  const recent = catalog.filter((item) => (records[item.id]?.lastReviewedAt ?? 0) >= Date.now() - 7 * 86400000).sort((left, right) => (records[right.id]?.lastReviewedAt ?? 0) - (records[left.id]?.lastReviewedAt ?? 0));
  const recentAttempts = recent.reduce((total, item) => total + (records[item.id]?.attempts ?? 0), 0);
  const recentCorrect = recent.reduce((total, item) => total + (records[item.id]?.correct ?? 0), 0);
  const priorityLabel = label(summary.priority.skillType);
  const vocabulary = catalog.filter((item): item is VocabularyItem => item.category === "vocabulary");
  const kanji = catalog.filter((item): item is KanjiItem => item.category === "kanji");

  return (
    <div className="space-y-7">
      <section className="border-l-2 border-[#e5b85c] pl-4"><p className="eyebrow">Your week · 今週</p><h2 className="mt-1 text-xl font-medium">{recent.length ? `${recent.length} concepts moved this week.` : "Your next change starts with one small session."}</h2><p className="mt-2 text-sm leading-6 text-[#9297a1]">{recentAttempts ? `${recentCorrect} of ${recentAttempts} recent answers were correct. Your next priority is ${priorityLabel.toLowerCase()}.` : `Start with ${priorityLabel.toLowerCase()} to give the path its first signal.`}</p><div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs"><Link href={`/practice?mode=${practiceModes[summary.priority.skillType]}`} className="font-semibold text-[#e5b85c] hover:text-[#f1cf7c]">Strengthen {priorityLabel} →</Link>{recent[0] ? <Link href={`/entry/${recent[0].id}`} className="text-[#9297a1] hover:text-[#f5f5f2]">Last touched: {recent[0].title}</Link> : null}</div></section>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-[#102536]/55 p-4"><p className="eyebrow">Seen</p><p className="mt-2 text-3xl font-semibold text-[#f5f5f2]">{reviewed}<span className="ml-1 text-sm font-normal text-[#9297a1]">/ {catalog.length}</span></p></div>
        <div className="rounded-xl border border-white/10 bg-[#172b3a]/65 p-4"><p className="eyebrow">Learning</p><p className="mt-2 text-3xl font-semibold text-[#8cc9e5]">{learning}<span className="ml-1 text-sm font-normal text-[#9297a1]">in motion</span></p></div>
        <div className="rounded-xl border border-white/10 bg-[#241d38]/55 p-4"><p className="eyebrow">Held</p><p className="mt-2 text-3xl font-semibold text-[#e5b85c]">{mastered}<span className="ml-1 text-sm font-normal text-[#9297a1]">strong</span></p></div>
        <div className="rounded-xl border border-[#5d4c2c] bg-[#2b2418]/65 p-4"><p className="eyebrow">Weak</p><p className="mt-2 text-3xl font-semibold text-[#e5b85c]">{weak}</p></div>
        <div className="rounded-xl border border-white/10 bg-[#352021]/55 p-4"><p className="eyebrow">Due now</p><p className="mt-2 text-3xl font-semibold text-[#e34a3f]">{due}</p></div>
      </div>

      <section className="border-t border-[#292b31] pt-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow mb-2">N5 readiness</p><h2 className="text-xl font-medium">{summary.label}</h2><p className="mt-1 max-w-2xl text-sm text-[#9297a1]">{summary.summary}</p></div><Link href="/practice?mode=full" className="rounded-xl border border-[#5d3936] px-4 py-3 text-sm font-semibold text-[#f5f5f2] hover:border-[#e34a3f]">Take full mock <span aria-hidden="true">→</span></Link></div>
        <p className="mb-4 text-xs text-[#676c75]">Official target: {n5ExamRequirements.overallMinimum} / {n5ExamRequirements.overallMaximum} overall · floors {n5ExamRequirements.languageReadingMinimum} / {n5ExamRequirements.languageReadingMaximum} Language Knowledge + Reading and {n5ExamRequirements.listeningMinimum} / {n5ExamRequirements.listeningMaximum} Listening. Kizashi readiness is internal evidence, not an official score prediction.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{summary.skills.map((skill) => <div key={skill.skillType} className="rounded-xl border border-white/10 bg-[#101b2b]/70 p-4"><p className="text-sm text-[#f5f5f2]">{label(skill.skillType)}</p><p className="mt-2 text-xs text-[#e5b85c]">{statusLabel(skill.status)}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#292b31]"><div className="h-full rounded-full bg-gradient-to-r from-[#4f9ac0] to-[#e5b85c]" style={{ width: `${skill.coverage * 100}%` }} /></div><p className="mt-2 text-xs text-[#9297a1]">{Math.round(skill.coverage * 100)}% coverage · {skill.sampleSize} answers{skill.timedAccuracy !== null ? ` · ${Math.round(skill.timedAccuracy * 100)}% timed` : " · no timed run"}</p></div>)}</div><div className="mt-5 grid gap-3 sm:grid-cols-2">{summary.sections.map((section) => <div key={section.id} className="rounded-xl border border-white/10 bg-[#17181d]/65 p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm text-[#f5f5f2]">{section.label}</p><span className={`text-xs ${section.status === "above-minimum" ? "text-[#6fb98f]" : section.status === "below-minimum" ? "text-[#ef675d]" : "text-[#676c75]"}`}>{section.status === "above-minimum" ? "Above floor" : section.status === "below-minimum" ? "Below floor" : "Untested"}</span></div><p className="mt-2 text-xs text-[#9297a1]">{section.total ? `${section.correct} / ${section.total} raw practice answers · ${Math.round((section.ratio ?? 0) * 100)}%` : "No timed evidence yet"}</p><p className="mt-1 text-[10px] text-[#676c75]">Minimum-equivalent floor only; not an official JLPT score.</p></div>)}</div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between"><div><p className="eyebrow">Coverage</p><h2 className="mt-1 text-xl font-medium">The ground beneath you</h2></div><span className="text-xs text-[#9297a1]">{Math.round((reviewed / Math.max(catalog.length, 1)) * 100)}% explored</span></div>
        <div className="space-y-4">{categories.map((category) => { const total = catalog.filter((item) => item.category === category).length; const count = catalog.filter((item) => item.category === category && reviewedIds.has(item.id)).length; return <div key={category}><div className="mb-2 flex justify-between text-sm"><span className="text-[#f5f5f2]">{label(category)}</span><span className="text-[#9297a1]">{count} / {total} · {coverageLabel(count, total)}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#292b31]"><div className="h-full rounded-full bg-gradient-to-r from-[#4f9ac0] to-[#e5b85c]" style={{ width: `${(count / Math.max(total, 1)) * 100}%` }} /></div></div>; })}</div>
      </section>

      <KnowledgeMap items={catalog} />

      <section>
        <div className="mb-4 flex items-end justify-between gap-3"><div><p className="eyebrow">Topic trails · 話題</p><h2 className="mt-1 text-xl font-medium">Strengthen the least-held topics.</h2></div><Link href="/practice?mode=pass" className="text-xs text-[#e5b85c] hover:text-[#f1cf7c]">Pass mode →</Link></div>
        <div className="grid gap-2 sm:grid-cols-2">{topicCoverage.map(({ topic, held, total, counts }) => <Link key={topic} href={`/practice?mode=mixed&topic=${encodeURIComponent(topic)}`} className="rounded-xl border border-white/10 bg-[#101b2b]/65 p-4 hover:border-[#e5b85c]/60"><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="text-[#f5f5f2]">{topicLabel(topic)}</span><span className="text-xs text-[#9297a1]">{held} / {total}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#292b31]"><div className="h-full rounded-full bg-gradient-to-r from-[#4f9ac0] to-[#e5b85c]" style={{ width: `${(held / Math.max(total, 1)) * 100}%` }} /></div><p className="mt-2 text-[10px] text-[#676c75]">{counts.vocabulary} words · {counts.kanji} kanji · {counts.grammar} grammar · {counts.reading + counts.listening} contexts</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-[#676c75]">Open focused practice →</p></Link>)}</div>
      </section>

      <section className="border-t border-[#292b31] pt-6"><p className="eyebrow mb-2">Curriculum bands</p><p className="mb-4 text-sm text-[#9297a1]">A conservative syllabus keeps essentials visible without pretending the unofficial JLPT lists are exact.</p><div className="grid gap-3 sm:grid-cols-3">{bands.map((band) => { const bandItems = catalog.filter((item) => getCurriculumBand(item) === band); const bandReviewed = bandItems.filter((item) => reviewedIds.has(item.id)).length; return <div key={band} className="rounded-xl border border-white/10 bg-[#101b2b]/70 p-4"><p className="eyebrow">{band}</p><p className="mt-2 text-2xl font-semibold text-[#f5f5f2]">{bandReviewed}<span className="ml-1 text-sm font-normal text-[#9297a1]">/ {bandItems.length}</span></p><p className="mt-1 text-xs text-[#9297a1]">{Math.round((bandReviewed / Math.max(bandItems.length, 1)) * 100)}% covered</p></div>; })}</div></section>

      {recurring.length ? <section className="border-t border-[#292b31] pt-6"><p className="eyebrow mb-2">Mistake notebook</p><p className="mb-4 text-sm text-[#9297a1]">The items you have asked to see again most often.</p><div className="space-y-2">{recurring.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg bg-[#21191a]/70 px-3 py-3 text-sm"><span className="jp-serif text-lg text-[#f5f5f2]"><JapaneseText text={item.title} vocabulary={vocabulary} kanji={kanji} always inspect={false} /></span><span className="text-xs text-[#e5b85c]">{mistakes[item.id].count} again{mistakes[item.id].count === 1 ? "" : "s"}</span></div>)}</div></section> : null}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#292b31] pt-6"><p className="text-sm text-[#9297a1]">Priority: <span className="text-[#e5b85c]">{label(summary.priority.skillType)}</span>. Keep the rhythm small.</p><div className="flex gap-3"><Link href="/review" className="rounded-xl border border-[#5d3936] px-4 py-3 text-sm font-semibold text-[#f5f5f2] hover:border-[#e34a3f]">Review</Link><Link href={`/practice?mode=${practiceModes[summary.priority.skillType]}`} className="rounded-xl bg-[#e34a3f] px-4 py-3 text-sm font-semibold text-[#0b0b0d] hover:bg-[#ef675d]">Strengthen {label(summary.priority.skillType)} <span className="ml-2" aria-hidden="true">→</span></Link></div></div>
    </div>
  );
}
