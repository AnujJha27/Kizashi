import { ProgressDashboard } from "@/components/progress/progress-dashboard";
import { DiagnosticSummary } from "@/components/progress/diagnostic-summary";
import { PracticeSignals } from "@/components/progress/practice-signals";
import { n5Module } from "@/lib/curriculum";

export const metadata = { title: "Progress" };

export default function ProgressPage() {
  const items = [...n5Module.vocabulary, ...n5Module.kanji, ...n5Module.grammar, ...n5Module.readings, ...n5Module.listening];

  return <div className="progress-page mx-auto max-w-5xl"><div className="mb-8"><p className="eyebrow mb-3">Progress · coverage</p><h1 className="jp-serif text-3xl tracking-tight text-[#f5f5f2] sm:text-4xl">Notice the ground you have covered.</h1><p className="mt-2 max-w-xl text-sm text-[#9297a1]">Completion is one signal. Retention is the path we are watching.</p></div><section className="surface-panel overflow-hidden p-7 sm:p-10"><ProgressDashboard items={items} /></section><PracticeSignals /><div className="mt-6"><DiagnosticSummary /></div></div>;
}
