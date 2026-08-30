"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { useContentModule } from "@/components/content/use-content-module";
import { getValidatedPracticeQuestions } from "@/lib/questions";
import { readQuestionStats, type QuestionStats } from "@/lib/session";

export function PracticeSignals() {
  const [stats, setStats] = useState<QuestionStats[] | null>(null);
  const module = useContentModule();
  const questionMeta = useMemo(() => new Map(getValidatedPracticeQuestions(module).map((question) => [question.id, question])), [module]);

  useEffect(() => {
    const refresh = () => setStats(Object.values(readQuestionStats()));
    refresh();
    window.addEventListener("michi-review-updated", refresh);
    window.addEventListener("michi-question-stats-updated", refresh);
    return () => { window.removeEventListener("michi-review-updated", refresh); window.removeEventListener("michi-question-stats-updated", refresh); };
  }, []);

  const weakestTypes = useMemo(() => {
    if (!stats?.length) return [];
    const groups = new Map<string, { questionType: string; category: string; attempts: number; correct: number; uncertain: number; slow: number }>();
    stats.forEach((entry) => {
      const question = questionMeta.get(entry.questionId);
      if (!question) return;
      const key = `${question.category}:${question.questionType}`;
      const group = groups.get(key) ?? { questionType: question.questionType, category: question.category, attempts: 0, correct: 0, uncertain: 0, slow: 0 };
      group.attempts += entry.attempts;
      group.correct += entry.correct;
      group.uncertain += entry.lastConfidence === "guess" || entry.lastConfidence === "unsure" ? 1 : 0;
      group.slow += entry.slowCount ?? 0;
      groups.set(key, group);
    });
    return [...groups.values()].sort((left, right) => left.correct / Math.max(left.attempts, 1) - right.correct / Math.max(right.attempts, 1) || right.attempts - left.attempts).slice(0, 5);
  }, [questionMeta, stats]);
  if (!stats?.length) return null;
  const wrong = stats.reduce((total, entry) => total + Math.max(entry.attempts - entry.correct, 0), 0);
  const uncertain = stats.filter((entry) => entry.lastConfidence === "guess" || entry.lastConfidence === "unsure").length;
  const slow = stats.reduce((total, entry) => total + (entry.slowCount ?? 0), 0);

  return <section className="surface-panel-raised mt-6 p-6"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow mb-2">Practice signals · 判断</p><h2 className="text-xl font-medium">Where the answers still cost effort.</h2><p className="mt-1 text-sm text-[#9297a1]">Quick Drill uses these signals to bring the right questions back.</p></div><Link href="/practice?mode=weak" className="text-sm font-semibold text-[#e5b85c] hover:text-[#f1cf7c]">Repair weak areas →</Link></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-[#713b37]/70 bg-[#21191a]/70 p-4"><p className="text-xs text-[#9297a1]">Wrong</p><p className="mt-2 text-2xl font-semibold text-[#ef675d]">{wrong}</p></div><div className="rounded-xl border border-[#5d4c2c] bg-[#2b2418]/70 p-4"><p className="text-xs text-[#9297a1]">Uncertain</p><p className="mt-2 text-2xl font-semibold text-[#e5b85c]">{uncertain}</p></div><div className="rounded-xl border border-[#31516a] bg-[#102536]/70 p-4"><p className="text-xs text-[#9297a1]">Slow</p><p className="mt-2 text-2xl font-semibold text-[#8cc9e5]">{slow}</p></div></div>{weakestTypes.length ? <div className="mt-6 border-t border-white/10 pt-5"><div className="mb-3 flex items-center justify-between gap-3"><div><p className="eyebrow">Question types</p><p className="mt-1 text-xs text-[#9297a1]">Your weakest practiced decision patterns.</p></div><span className="text-xs text-[#676c75]">accuracy · attempts</span></div><div className="space-y-2">{weakestTypes.map((entry) => { const accuracy = Math.round((entry.correct / Math.max(entry.attempts, 1)) * 100); return <Link key={`${entry.category}-${entry.questionType}`} href={`/practice?mode=${entry.category}`} className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#101b2b]/55 px-3 py-3 hover:border-[#e5b85c]/60"><span className="min-w-0 flex-1"><span className="block text-sm text-[#f5f5f2]">{entry.questionType}</span><span className="mt-1 block text-[10px] uppercase tracking-[.12em] text-[#676c75]">{entry.category}{entry.uncertain ? ` · ${entry.uncertain} uncertain` : ""}{entry.slow ? ` · ${entry.slow} slow` : ""}</span></span><span className={`text-sm font-semibold ${accuracy < 75 ? "text-[#ef675d]" : "text-[#e5b85c]"}`}>{accuracy}% <span className="text-xs font-normal text-[#676c75]">· {entry.attempts}</span></span><span className="text-[#e5b85c]" aria-hidden="true">→</span></Link>; })}</div></div> : null}</section>;
}
