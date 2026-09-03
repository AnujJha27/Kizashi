import Link from "next/link";

import { LocalDiagnostic } from "@/components/practice/local-practice";

export const metadata = { title: "N5 Diagnostic" };

export default function DiagnosticPage() {
  return <div className="mx-auto max-w-5xl"><div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow mb-3">N5 diagnostic · skill map</p><h1 className="jp-serif text-3xl tracking-tight text-[#f5f5f2] sm:text-4xl">Where should the path lead next?</h1><p className="mt-2 max-w-xl text-sm text-[#9297a1]">A short sampler across vocabulary, kanji, grammar, reading, and listening. Use it to choose your next priority.</p></div><Link href="/practice" className="text-sm text-[#e5b85c] hover:text-[#f1cf7c]">Back to practice →</Link></div><section className="surface-panel overflow-hidden p-7 sm:p-10"><LocalDiagnostic /></section></div>;
}
