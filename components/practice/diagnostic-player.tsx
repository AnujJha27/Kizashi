"use client";

import { PracticePlayer } from "@/components/practice/practice-player";
import { writeDiagnosticResult } from "@/lib/session";
import type { PracticeQuestion } from "@/lib/types";

export function DiagnosticPlayer({ questions }: Readonly<{ questions: PracticeQuestion[] }>) {
  return <PracticePlayer questions={questions} examMode onComplete={(result) => writeDiagnosticResult({ level: "N5", ...result, completedAt: Date.now() })} />;
}
