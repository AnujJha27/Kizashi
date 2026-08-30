"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { readDiagnosticResult, readExamAttempts, type DiagnosticResult, type ExamAttempt } from "@/lib/session";

const labels: Record<string, string> = { vocabulary: "Vocabulary", kanji: "Kanji", grammar: "Grammar", reading: "Reading", listening: "Listening" };

export function DiagnosticSummary() {
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);

  useEffect(() => {
    const refresh = () => { setResult(readDiagnosticResult()); setAttempt(readExamAttempts().find((entry) => entry.section === "diagnostic") ?? null); };
    refresh();
    window.addEventListener("michi-exam-attempt-updated", refresh);
    return () => window.removeEventListener("michi-exam-attempt-updated", refresh);
  }, []);

  if (!result) return null;

  return <section className="surface-panel-raised p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow mb-2">Latest diagnostic</p><h2 className="text-xl font-medium">{result.correct} / {result.total} correct</h2><p className="mt-1 text-sm text-[#9297a1]">Use the weakest skill as your next stop. This is a guide, not a fake pass probability.</p>{attempt ? <p className="mt-2 text-xs text-[#676c75]">Last run · {Math.floor(attempt.duration / 60)}:{String(attempt.duration % 60).padStart(2, "0")} · {attempt.questionsAttempted} answered{attempt.weakTopics.length ? ` · focus: ${attempt.weakTopics.map((topic) => labels[topic] ?? topic).join(", ")}` : ""}</p> : null}</div><Link href="/practice/diagnostic" className="text-sm font-semibold text-[#e5b85c] hover:text-[#f1cf7c]">Retake diagnostic →</Link></div><div className="mt-5 grid gap-2 sm:grid-cols-5">{Object.entries(result.categoryBreakdown).map(([category, score]) => <div key={category} className="rounded-lg bg-[#101b2b]/70 p-3"><p className="text-xs text-[#9297a1]">{labels[category] ?? category}</p><p className="mt-1 text-sm font-semibold text-[#f5f5f2]">{score.correct} / {score.total}</p></div>)}</div></section>;
}
