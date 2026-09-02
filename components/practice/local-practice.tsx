"use client";

import { useEffect, useMemo, useState } from "react";

import { useContentModule } from "@/components/content/use-content-module";
import { AdaptivePractice } from "@/components/practice/adaptive-practice";
import { PracticePlayer } from "@/components/practice/practice-player";
import { WeakPractice } from "@/components/practice/weak-practice";
import { getModuleItems, readValidatedQuestionDraft } from "@/lib/content-validation";
import { getTopicItemIds } from "@/lib/curriculum";
import { filterExamLevelQuestions } from "@/lib/jlpt-core.js";
import { getValidatedPracticeQuestions, migrateLegacyQuestionPrompts, selectPracticeQuestions } from "@/lib/questions";
import { readMistakes, readReviewRecords, writeDiagnosticResult } from "@/lib/session";
import { quickPracticeCount } from "@/lib/study-core.js";
import type { N5Module, PracticeMode, PracticeQuestion, TargetLevel } from "@/lib/types";

function practiceModule(module: N5Module, targetLevel: TargetLevel) {
  const alwaysInclude = new Set([
    ...Object.keys(readMistakes()),
  ]);
  const records = readReviewRecords();
  const keep = <T extends { id: string; tags: string[]; jlptLevel: string | null }>(items: T[], limit: number) => {
    const candidates = items.filter((item) => !alwaysInclude.has(item.id) && !item.tags.includes("personal")).sort((left, right) => (targetLevel === "N4" ? Number(right.jlptLevel === "N4") - Number(left.jlptLevel === "N4") : Number(right.jlptLevel === "N5") - Number(left.jlptLevel === "N5")) || (records[left.id]?.attempts ?? 0) - (records[right.id]?.attempts ?? 0) || left.id.localeCompare(right.id)).slice(0, limit);
    const candidateIds = new Set(candidates.map((item) => item.id));
    return items.filter((item) => alwaysInclude.has(item.id) || item.tags.includes("personal") || candidateIds.has(item.id));
  };
  const vocabulary = keep(module.vocabulary, 120);
  const kanji = keep(module.kanji, 50);
  const grammar = keep(module.grammar, 50);
  const readings = keep(module.readings, 20);
  const listening = keep(module.listening, 20);
  const retainedIds = new Set([...vocabulary, ...kanji, ...grammar, ...readings, ...listening].map((item) => item.id));
  return { ...module, vocabulary, kanji, grammar, readings, listening, grammarContrasts: module.grammarContrasts.filter((contrast) => contrast.grammarPointIds.some((id) => retainedIds.has(id))), practiceQuestions: module.practiceQuestions?.filter((question) => retainedIds.has(question.itemId)) };
}

function useActiveQuestions(fallback: PracticeQuestion[], targetLevel: TargetLevel) {
  const [questions, setQuestions] = useState(fallback);
  const loadedModule = useContentModule();
  const module = useMemo(() => practiceModule(loadedModule, targetLevel), [loadedModule, targetLevel]);

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

export function LocalPractice({ allQuestions, mode, duration, focus, section, topic, targetLevel }: Readonly<{ allQuestions?: PracticeQuestion[]; mode: PracticeMode; duration: number; focus?: string; section?: string; topic?: string; targetLevel: TargetLevel }>) {
  // The browser receives the bounded learner module below; generating the full
  // staged bank here freezes navigation before that module can arrive.
  const fallbackQuestions = useMemo(() => allQuestions ?? [], [allQuestions]);
  const { questions: activeQuestions, module } = useActiveQuestions(fallbackQuestions, targetLevel);
  const [repair, setRepair] = useState("");
  useEffect(() => setRepair(new URLSearchParams(window.location.search).get("repair") ?? ""), []);
  const topicIds = topic ? getTopicItemIds([...module.vocabulary, ...module.kanji, ...module.grammar, ...module.readings, ...module.listening], topic) : null;
  const scopedQuestions = topicIds ? activeQuestions.filter((question) => topicIds.has(question.itemId)) : activeQuestions;
  const focusedIds = focus ? new Set(module.grammarContrasts.find((contrast) => contrast.id === focus)?.grammarPointIds ?? []) : null;
  const focusQuestions = focusedIds?.size ? scopedQuestions.filter((question) => focusedIds.has(question.itemId)) : scopedQuestions;
  const repairQuestions = repair ? focusQuestions.filter((question) => question.id === repair || question.itemId === repair || question.targetItemIds?.includes(repair)) : focusQuestions;
  const quickPool = [...new Map([...selectPracticeQuestions("quick", focusQuestions, targetLevel), ...selectPracticeQuestions("mixed", focusQuestions, targetLevel)].map((question) => [question.id, question])).values()];
  const selected = mode === "weak" ? repairQuestions : mode === "quick" ? quickPool : mode === "section" && section === "vocabulary" ? [...selectPracticeQuestions("vocabulary", focusQuestions, targetLevel).slice(0, 8), ...selectPracticeQuestions("kanji", focusQuestions, targetLevel).slice(0, 4)] : mode === "section" && section === "grammar-reading" ? [...selectPracticeQuestions("grammar", focusQuestions, targetLevel).slice(0, 8), ...selectPracticeQuestions("reading", focusQuestions, targetLevel).slice(0, 6)] : mode === "section" && section === "listening" ? selectPracticeQuestions("listening", focusQuestions, targetLevel).slice(0, 10) : selectPracticeQuestions(mode, focusQuestions, targetLevel);
  const quickCount = quickPracticeCount(duration);
  const questions = selected;

  const items = [...module.vocabulary, ...module.kanji, ...module.grammar, ...module.readings, ...module.listening];
  if (mode === "weak") return <WeakPractice questions={questions} vocabulary={module.vocabulary} kanji={module.kanji} items={items} learnerErrorAggregates={module.learnerErrorAggregates} repairId={repair ? `repair-${repair}` : undefined} />;
  if (mode === "pass") return <AdaptivePractice questions={filterExamLevelQuestions(focusQuestions, targetLevel)} vocabulary={module.vocabulary} kanji={module.kanji} items={items} learnerErrorAggregates={module.learnerErrorAggregates} limit={13} passMode />;
  if (mode === "quick") return <AdaptivePractice questions={questions} vocabulary={module.vocabulary} kanji={module.kanji} items={items} learnerErrorAggregates={module.learnerErrorAggregates} limit={quickCount} />;
  const examMode = ["mock", "mini", "section", "full", "integrated"].includes(mode);
  return <PracticePlayer questions={questions} vocabulary={module.vocabulary} kanji={module.kanji} examMode={examMode} targetLevel={targetLevel} examLabel={mode === "integrated" ? `${targetLevel} integrated context` : mode === "full" ? `${targetLevel} full mock` : mode === "section" ? `${targetLevel} section test` : mode === "mini" ? `${targetLevel} mini test` : `${targetLevel} sampler`} sessionId={examMode ? `${mode}-test-${targetLevel.toLowerCase()}` : undefined} timeLimitSeconds={examMode ? Math.max(300, questions.length * 45) : undefined} />;
}

export function LocalDiagnostic({ allQuestions }: Readonly<{ allQuestions: PracticeQuestion[] }>) {
  const { questions: activeQuestions, module } = useActiveQuestions(allQuestions, "N5");
  const questions = selectPracticeQuestions("mock", activeQuestions);
  return <PracticePlayer questions={questions} vocabulary={module.vocabulary} kanji={module.kanji} examMode examLabel="N5 diagnostic" sessionId="diagnostic" timeLimitSeconds={Math.max(300, questions.length * 45)} onComplete={(result) => writeDiagnosticResult({ level: "N5", ...result, completedAt: Date.now() })} />;
}
