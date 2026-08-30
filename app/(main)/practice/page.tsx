import Link from "next/link";

import { LocalPractice } from "@/components/practice/local-practice";
import { getValidatedPracticeQuestions } from "@/lib/questions";
import type { PracticeMode } from "@/lib/types";

export const metadata = { title: "Practice" };

const modes: { value: PracticeMode; label: string; jp: string }[] = [
  { value: "quick", label: "Quick drill", jp: "小さな練習" },
  { value: "vocabulary", label: "Vocabulary", jp: "ことば" },
  { value: "kanji", label: "Kanji", jp: "漢字" },
  { value: "grammar", label: "Grammar", jp: "文法" },
  { value: "reading", label: "Reading", jp: "読解" },
  { value: "listening", label: "Listening", jp: "聴解" },
  { value: "mixed", label: "Mixed", jp: "総合" },
  { value: "pass", label: "Pass N5", jp: "合格への道" },
  { value: "mini", label: "Mini test", jp: "小テスト" },
  { value: "section", label: "Section test", jp: "分野テスト" },
  { value: "full", label: "Full mock", jp: "本番模試" },
  { value: "mock", label: "N5 sampler", jp: "模擬" },
  { value: "weak", label: "Weak areas", jp: "弱点" },
];

function isPracticeMode(value: string | undefined): value is PracticeMode {
  return modes.some((mode) => mode.value === value);
}

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ mode?: string; duration?: string; focus?: string; section?: string; topic?: string }> }) {
  const { mode: requestedMode, duration: requestedDuration, focus, section, topic } = await searchParams;
  const mode = isPracticeMode(requestedMode) ? requestedMode : "quick";
  const duration = ["2", "5", "10", "20", "30"].includes(requestedDuration ?? "") ? Number(requestedDuration) : 5;
  const activeSection = section === "grammar-reading" || section === "listening" ? section : "vocabulary";
  const activeTopic = topic?.trim() || undefined;
  const allQuestions = getValidatedPracticeQuestions();
  return <div className="mx-auto max-w-5xl"><div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow mb-3">Practice · JLPT N5</p><h1 className="jp-serif text-3xl tracking-tight text-[#f5f5f2] sm:text-4xl">小さく解いて、強くなる。</h1><p className="mt-2 max-w-xl text-sm text-[#9297a1]">Short, focused questions across the skills you need for a comfortable N5 pass.</p></div><div className="flex flex-wrap gap-3"><Link href="/practice/kana" className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#5d3936] px-4 py-3 text-sm font-semibold text-[#f5f5f2] hover:border-[#e5b85c]">Kana foundations <span aria-hidden="true">→</span></Link><Link href="/practice/diagnostic" className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#5d3936] px-4 py-3 text-sm font-semibold text-[#f5f5f2] hover:border-[#e34a3f]">N5 diagnostic <span aria-hidden="true">→</span></Link><Link href="/review" className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#5d3936] px-4 py-3 text-sm font-semibold text-[#9297a1] hover:border-[#e34a3f]">Review queue <span aria-hidden="true">→</span></Link></div></div><div className="mb-4 flex gap-2 overflow-x-auto pb-1">{modes.map((entry) => <Link key={entry.value} href={`/practice?mode=${entry.value}${activeTopic ? `&topic=${encodeURIComponent(activeTopic)}` : ""}`} className={`shrink-0 rounded-xl border px-4 py-3 text-sm ${entry.value === mode ? "border-[#e34a3f] bg-[#3a2023] text-[#f5f5f2]" : "border-[#292b31] bg-[#17181d]/65 text-[#9297a1] hover:border-[#5d3936]"}`}><span className="block">{entry.label}</span><span className="jp-serif text-xs text-[#e5b85c]">{entry.jp}</span></Link>)}</div>{activeTopic ? <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-[#4b3a29] bg-[#211d18]/70 px-4 py-3 text-sm"><span>Topic focus · <span className="text-[#e5b85c]">{activeTopic.replace(/-/gu, " ")}</span></span><Link href={`/practice?mode=${mode}`} className="text-xs text-[#9297a1] hover:text-[#f5f5f2]">Clear focus</Link></div> : null}{mode === "section" ? <div className="mb-6 flex flex-wrap items-center gap-2"><span className="text-xs text-[#9297a1]">Section</span>{[["vocabulary", "Vocabulary + kanji"], ["grammar-reading", "Grammar + reading"], ["listening", "Listening"]].map(([value, label]) => <Link key={value} href={`/practice?mode=section&section=${value}${activeTopic ? `&topic=${encodeURIComponent(activeTopic)}` : ""}`} className={`rounded-lg px-3 py-2 text-xs ${activeSection === value ? "bg-[#e5b85c] text-[#0b0b0d]" : "border border-[#3f4652] text-[#9297a1] hover:border-[#e5b85c]"}`}>{label}</Link>)}</div> : mode === "quick" ? <div className="mb-6 flex items-center gap-2"><span className="text-xs text-[#9297a1]">Session length</span>{[2, 5, 10, 20, 30].map((minutes) => <Link key={minutes} href={`/practice?mode=quick&duration=${minutes}${activeTopic ? `&topic=${encodeURIComponent(activeTopic)}` : ""}`} className={`rounded-lg px-3 py-2 text-xs ${duration === minutes ? "bg-[#e5b85c] text-[#0b0b0d]" : "border border-[#3f4652] text-[#9297a1] hover:border-[#e5b85c]"}`}>{minutes} min</Link>)}</div> : null}<section className="surface-panel overflow-hidden p-7 sm:p-10"><LocalPractice allQuestions={allQuestions} mode={mode} duration={duration} focus={focus} section={mode === "section" ? activeSection : section} topic={activeTopic} /></section></div>;
}
