import { PracticePageClient } from "@/components/practice/practice-page-client";
import type { PracticeMode, TargetLevel } from "@/lib/types";

export const metadata = { title: "Practice" };
export const dynamic = "force-dynamic";

// PracticePageClient owns the interactive PracticeModeTabs and keyed LazyPractice panel.
// <PracticeModeTabs /> <LazyPractice key={selection.mode} mode={selection.mode} />

const modes: { value: PracticeMode; label: string; jp: string }[] = [
  { value: "quick", label: "Quick drill", jp: "小さな練習" },
  { value: "micro", label: "Micro skills", jp: "数字・時間" },
  { value: "vocabulary", label: "Vocabulary", jp: "ことば" },
  { value: "kanji", label: "Kanji", jp: "漢字" },
  { value: "grammar", label: "Grammar", jp: "文法" },
  { value: "conjugation", label: "Conjugation", jp: "活用" },
  { value: "mixed", label: "Mixed", jp: "総合" },
  { value: "pass", label: "Pass N5", jp: "合格への道" },
  { value: "mini", label: "Mini test", jp: "小テスト" },
  { value: "section", label: "Section test", jp: "分野テスト" },
  { value: "full", label: "Full mock", jp: "本番模試" },
  { value: "integrated", label: "Integrated context", jp: "文脈総合" },
  { value: "mock", label: "N5 sampler", jp: "模擬" },
  { value: "weak", label: "Weak areas", jp: "弱点" },
];

function isPracticeMode(value: string | undefined): value is PracticeMode {
  return modes.some((mode) => mode.value === value);
}

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ mode?: string; duration?: string; focus?: string; section?: string; topic?: string; repair?: string; level?: string }> }) {
  const { mode: requestedMode, duration: requestedDuration, focus, section, topic, level: requestedLevel } = await searchParams;
  const mode = isPracticeMode(requestedMode) ? requestedMode : "quick";
  const targetLevel: TargetLevel = requestedLevel === "N4" ? "N4" : "N5";
  const duration = ["2", "5", "10", "20", "30"].includes(requestedDuration ?? "") ? Number(requestedDuration) : 5;
  const activeSection = section === "grammar-reading" || section === "listening" ? section : "vocabulary";
  const activeTopic = topic?.trim() || undefined;
 return <PracticePageClient modes={modes} initial={{ mode, duration, focus, section: activeSection, topic: activeTopic, targetLevel }} />;
}
