"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "michi.profile-preferences";

export function ExamCountdown() {
  const [examDate, setExamDate] = useState("");

  useEffect(() => {
    const read = () => { try { const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}"); setExamDate(typeof value.examDate === "string" ? value.examDate : ""); } catch { setExamDate(""); } };
    read();
    window.addEventListener("michi-profile-updated", read);
    return () => window.removeEventListener("michi-profile-updated", read);
  }, []);

  if (!examDate) return null;
  const days = Math.ceil((new Date(`${examDate}T23:59:59`).getTime() - Date.now()) / 86400000);
  const phase = days < 0 ? "Choose a new target date" : days <= 21 ? "Final 2–3 weeks · repair weak areas" : days <= 56 ? "6–8 weeks · add timed mixed work" : "Build coverage · learn and retain";
  const action = days <= 21 ? { href: "/practice?mode=section", label: "Open section practice" } : days <= 56 ? { href: "/practice?mode=mock", label: "Open timed sampler" } : { href: "/practice?mode=pass", label: "Build pass coverage" };

  return <section className="surface-panel-raised p-6"><p className="eyebrow mb-2">Exam countdown · 試験まで</p><div className="flex items-end justify-between gap-4"><div><p className="text-3xl font-semibold text-[#e5b85c]">{days < 0 ? "—" : days}<span className="ml-2 text-sm font-normal text-[#9297a1]">{days < 0 ? "days past" : "days"}</span></p><p className="mt-2 text-sm text-[#9297a1]">{examDate} · {phase}</p></div><span className="jp-serif text-3xl text-[#e34a3f]">道</span></div>{days >= 0 ? <Link href={action.href} className="mt-5 inline-flex rounded-xl border border-[#5d3936] px-4 py-3 text-sm font-semibold text-[#f5f5f2] hover:border-[#e34a3f]">{action.label} <span className="ml-2" aria-hidden="true">→</span></Link> : null}</section>;
}
