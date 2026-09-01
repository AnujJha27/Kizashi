"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getAdaptivePlan } from "@/lib/exam-plan-core.js";
import { getDueReviewIds, readExamAttempts, readExamPlanPreferences, readMistakes, readRepairRecords } from "@/lib/session";
import { getDueRepairs } from "@/lib/repair-core.js";

export function ExamCountdown() {
  const [plan, setPlan] = useState(() => getAdaptivePlan());

  useEffect(() => {
    const refresh = () => {
      const preferences = readExamPlanPreferences();
      const attempts = readExamAttempts().filter((attempt) => attempt.section !== "integrated").slice(0, 3);
      const recentAccuracy = attempts.length ? attempts.reduce((total, attempt) => total + attempt.correct / Math.max(attempt.questionsAttempted, 1), 0) / attempts.length : null;
      setPlan(getAdaptivePlan({ examDate: preferences.examDate, dueCount: getDueReviewIds().length, weakCount: Math.max(Object.keys(readMistakes()).length, getDueRepairs(readRepairRecords()).length), recentAccuracy, readiness: recentAccuracy !== null && recentAccuracy >= 0.85 ? "strong" : "untested" }));
    };
    refresh();
    window.addEventListener("michi-profile-updated", refresh);
    window.addEventListener("michi-review-updated", refresh);
    window.addEventListener("michi-mistakes-updated", refresh);
    window.addEventListener("michi-exam-attempt-updated", refresh);
    return () => { window.removeEventListener("michi-profile-updated", refresh); window.removeEventListener("michi-review-updated", refresh); window.removeEventListener("michi-mistakes-updated", refresh); window.removeEventListener("michi-exam-attempt-updated", refresh); };
  }, []);

  if (plan.daysRemaining === null) return <section className="surface-panel-raised p-6"><p className="eyebrow mb-2">Exam plan · 試験計画</p><p className="text-lg font-medium text-[#f5f5f2]">No exam date set.</p><p className="mt-2 text-sm text-[#9297a1]">Kizashi will keep recommending lesson, review, and repair work without inventing a deadline.</p><Link href="/profile" className="mt-5 inline-flex rounded-xl border border-[#5d3936] px-4 py-3 text-sm font-semibold text-[#f5f5f2] hover:border-[#e34a3f]">Set exam date <span className="ml-2" aria-hidden="true">→</span></Link></section>;

  return <section className="surface-panel-raised p-6"><p className="eyebrow mb-2">Exam countdown · 試験まで</p><div className="flex items-end justify-between gap-4"><div><p className="text-3xl font-semibold text-[#e5b85c]">{plan.daysRemaining < 0 ? "—" : plan.daysRemaining}<span className="ml-2 text-sm font-normal text-[#9297a1]">{plan.daysRemaining < 0 ? "days past" : "days"}</span></p><p className="mt-2 text-sm text-[#9297a1]">{plan.state === "overdue" ? "Choose a new target date" : plan.action.label}</p><p className="mt-1 text-xs text-[#676c75]">{plan.dueCount} due · {plan.weakCount} weak concepts</p></div><span className="jp-serif text-3xl text-[#e34a3f]">道</span></div><Link href={plan.action.href} className="mt-5 inline-flex rounded-xl border border-[#5d3936] px-4 py-3 text-sm font-semibold text-[#f5f5f2] hover:border-[#e34a3f]">{plan.action.label} <span className="ml-2" aria-hidden="true">→</span></Link></section>;
}
