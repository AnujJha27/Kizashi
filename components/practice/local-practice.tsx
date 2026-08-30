"use client";

import { useEffect, useState } from "react";

import { useContentModule } from "@/components/content/use-content-module";
import { AdaptivePractice } from "@/components/practice/adaptive-practice";
import { PracticePlayer } from "@/components/practice/practice-player";
import { WeakPractice } from "@/components/practice/weak-practice";
import { getModuleItems, readValidatedQuestionDraft } from "@/lib/content-validation";
import { getTopicItemIds } from "@/lib/curriculum";
import { getValidatedPracticeQuestions, migrateLegacyQuestionPrompts, selectPracticeQuestions } from "@/lib/questions";
import { writeDiagnosticResult } from "@/lib/session";
import type { PracticeMode, PracticeQuestion } from "@/lib/types";

function useActiveQuestions(fallback: PracticeQuestion[]) {
  const [questions, setQuestions] = useState(fallback);
  const module = useContentModule();

  useEffect(() => {
    const refresh = () => {
      const generated = getValidatedPracticeQuestions(module);
      const active = generated.length ? generated : fallback;
      const moduleItems = getModuleItems(module);
      const knownItemIds = new Set(moduleItems.map((item) => item.id));
      const knownItemCategories = new Map(moduleItems.map((item) => [item.id, item.category]));
      const saved = readValidatedQuestionDraft(knownItemIds, knownItemCategories);
      setQuestions(saved ? migrateLegacyQuestionPrompts(saved, module) : active);
    };
    refresh();
    window.addEventListener("michi-content-draft-updated", refresh);
    window.addEventListener("michi-question-draft-updated", refresh);
    return () => {
      window.removeEventListener("michi-content-draft-updated", refresh);
      window.removeEventListener("michi-question-draft-updated", refresh);
    };
  }, [fallback, module]);

  return { questions, module };
}

export function LocalPractice({ allQuestions, mode, duration, focus, section, topic }: Readonly<{ allQuestions: PracticeQuestion[]; mode: PracticeMode; duration: number; focus?: string; section?: string; topic?: string }>) {
  const { questions: activeQuestions, module } = useActiveQuestions(allQuestions);
  const topicIds = topic ? getTopicItemIds([...module.vocabulary, ...module.kanji, ...module.grammar, ...module.readings, ...module.listening], topic) : null;
  const scopedQuestions = topicIds ? activeQuestions.filter((question) => topicIds.has(question.itemId)) : activeQuestions;
  const focusedIds = focus ? new Set(module.grammarContrasts.find((contrast) => contrast.id === focus)?.grammarPointIds ?? []) : null;
  const focusQuestions = focusedIds?.size ? scopedQuestions.filter((question) => focusedIds.has(question.itemId)) : scopedQuestions;
  const selected = mode === "weak" ? focusQuestions : mode === "section" && section === "vocabulary" ? [...selectPracticeQuestions("vocabulary", focusQuestions).slice(0, 8), ...selectPracticeQuestions("kanji", focusQuestions).slice(0, 4)] : mode === "section" && section === "grammar-reading" ? [...selectPracticeQuestions("grammar", focusQuestions).slice(0, 8), ...selectPracticeQuestions("reading", focusQuestions).slice(0, 6)] : mode === "section" && section === "listening" ? selectPracticeQuestions("listening", focusQuestions).slice(0, 10) : selectPracticeQuestions(mode, focusQuestions);
  const quickCount = duration >= 20 ? 13 : duration >= 10 ? 10 : duration >= 5 ? 7 : duration >= 3 ? 3 : 2;
  const questions = mode === "quick" ? selected.slice(0, quickCount) : selected;

  if (mode === "weak") return <WeakPractice questions={questions} vocabulary={module.vocabulary} kanji={module.kanji} />;
  if (mode === "pass") return <AdaptivePractice questions={focusQuestions} vocabulary={module.vocabulary} kanji={module.kanji} limit={13} passMode />;
  if (mode === "quick") return <AdaptivePractice questions={questions} vocabulary={module.vocabulary} kanji={module.kanji} />;
  const examMode = ["mock", "mini", "section", "full"].includes(mode);
  return <PracticePlayer questions={questions} vocabulary={module.vocabulary} kanji={module.kanji} examMode={examMode} examLabel={mode === "full" ? "N5 full mock" : mode === "section" ? "N5 section test" : mode === "mini" ? "N5 mini test" : "N5 sampler"} sessionId={examMode ? `${mode}-test` : undefined} timeLimitSeconds={examMode ? Math.max(300, questions.length * 45) : undefined} />;
}

export function LocalDiagnostic({ allQuestions }: Readonly<{ allQuestions: PracticeQuestion[] }>) {
  const { questions: activeQuestions, module } = useActiveQuestions(allQuestions);
  const questions = selectPracticeQuestions("mock", activeQuestions);
  return <PracticePlayer questions={questions} vocabulary={module.vocabulary} kanji={module.kanji} examMode examLabel="N5 diagnostic" sessionId="diagnostic" timeLimitSeconds={Math.max(300, questions.length * 45)} onComplete={(result) => writeDiagnosticResult({ level: "N5", ...result, completedAt: Date.now() })} />;
}
