"use client";

import { useState } from "react";

import type { LessonContentItem } from "@/lib/curriculum";
import type { PracticeQuestion } from "@/lib/types";

const questionTypes: Record<LessonContentItem["category"], string[]> = {
  vocabulary: ["meaning", "contextual vocabulary", "paraphrase", "orthography", "kana recall", "Japanese recall"],
  kanji: ["kanji reading", "kanji meaning", "reading in context", "word to kanji recall", "orthography", "kana recall"],
  grammar: ["sentence completion", "grammar in context", "sentence ordering", "meaning"],
  reading: ["short passage detail", "information retrieval", "reading in context"],
  listening: ["task-based response", "key point", "verbal expression", "quick response"],
};

function answerLabel(question: PracticeQuestion) {
  if (question.questionType === "sentence ordering" && question.tokens && question.correctOrder) return question.correctOrder.map((index) => question.tokens?.[index]).join(" ");
  if (question.answerMode === "text") return question.acceptedAnswers?.join(" / ") ?? "Not set";
  return question.options[question.correctIndex] ?? "Not set";
}

export function AIGenerator({ items, onAdd }: Readonly<{ items: LessonContentItem[]; onAdd: (question: PracticeQuestion) => void }>) {
  const [targetId, setTargetId] = useState(items[0]?.id ?? "");
  const [questionType, setQuestionType] = useState(questionTypes[items[0]?.category ?? "vocabulary"][0]);
  const [draft, setDraft] = useState<PracticeQuestion | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const target = items.find((item) => item.id === targetId) ?? items[0];
  const types = target ? questionTypes[target.category] : questionTypes.vocabulary;

  if (!items.length) return <section className="surface-panel-raised p-5 sm:p-6"><p className="eyebrow">Original draft generator</p><h2 className="mt-1 text-xl font-medium text-[#f5f5f2]">Approve source records before generating.</h2><p className="mt-2 text-sm text-[#9297a1]">AI drafts only use approved curriculum facts. Finish the source review queue, then return here.</p></section>;

  const generate = async () => {
    if (!target) return;
    setPending(true);
    setError("");
    setDraft(null);
    setSent(false);
    try {
      const response = await fetch("/api/content/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId: target.id, questionType, item: target }) });
      const payload = await response.json().catch(() => ({})) as { draft?: PracticeQuestion; error?: string };
      if (!response.ok || !payload.draft) throw new Error(payload.error ?? "Could not generate a draft.");
      setDraft(payload.draft);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not generate a draft.");
    } finally {
      setPending(false);
    }
  };

  return <section className="surface-panel-raised p-5 sm:p-6">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Original draft generator</p><h2 className="mt-1 text-xl font-medium text-[#f5f5f2]">Generate one question to review.</h2><p className="mt-1 max-w-2xl text-sm text-[#9297a1]">The model only drafts against a known Kizashi item. Nothing is published or saved until you inspect it and send it to the review queue.</p></div><span className="rounded-full border border-[#5d4c2c] px-3 py-1 text-[10px] uppercase tracking-[.12em] text-[#e5b85c]">draft only</span></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
      <label className="block text-xs text-[#9297a1]">Curriculum target<select value={target?.id ?? ""} onChange={(event) => { const next = items.find((item) => item.id === event.target.value); setTargetId(event.target.value); setQuestionType(next ? questionTypes[next.category][0] : questionTypes.vocabulary[0]); setDraft(null); setSent(false); }} className="mt-2 w-full rounded-xl border border-[#3f4652] bg-[#101b2b] px-3 py-3 text-sm text-[#f5f5f2] focus:border-[#e5b85c] focus:outline-none">{items.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.category}</option>)}</select></label>
      <label className="block text-xs text-[#9297a1]">Question shape<select value={questionType} onChange={(event) => { setQuestionType(event.target.value); setDraft(null); setSent(false); }} className="mt-2 w-full rounded-xl border border-[#3f4652] bg-[#101b2b] px-3 py-3 text-sm text-[#f5f5f2] focus:border-[#e5b85c] focus:outline-none">{types.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
      <button type="button" disabled={!target || pending} onClick={() => void generate()} className="rounded-xl bg-[#e34a3f] px-4 py-3 text-sm font-semibold text-[#0b0b0d] disabled:cursor-wait disabled:opacity-50 hover:bg-[#ef675d]">{pending ? "Generating…" : "Generate draft"}</button>
    </div>
    {error ? <p className="mt-4 rounded-lg border border-[#713b37] bg-[#21191a] px-3 py-3 text-sm text-[#ef675d]" role="alert">{error}</p> : null}
    {draft ? <article className="mt-5 rounded-xl border border-[#5d4c2c] bg-[#2b2418]/55 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">Generated · needs review</p><p className="mt-1 text-xs text-[#9297a1]">{draft.questionType} · {draft.generatedBy}</p></div><button type="button" disabled={sent} onClick={() => { onAdd(draft); setSent(true); }} className="rounded-lg border border-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#f1cf7c] hover:bg-[#302818] disabled:cursor-default disabled:border-[#315d4b] disabled:bg-[#183225] disabled:text-[#8bcca6]">{sent ? "Sent to review ✓" : "Send to review queue"}</button></div>
      <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[#f5f5f2]">{draft.prompt}</p>
      {draft.answerMode === "text" ? <p className="mt-3 text-xs text-[#8bcca6]">Accepted: {answerLabel(draft)}</p> : draft.questionType === "sentence ordering" ? <p className="mt-3 text-xs text-[#8bcca6]">Correct order: {answerLabel(draft)}</p> : <div className="mt-3 grid gap-2 sm:grid-cols-2">{draft.options.map((option, index) => <span key={`${option}-${index}`} className={`rounded-lg px-3 py-2 text-xs ${index === draft.correctIndex ? "bg-[#183225] text-[#8bcca6]" : "bg-[#101b2b] text-[#9297a1]"}`}>{option}</span>)}</div>}
      <p className="mt-3 text-xs leading-5 text-[#9297a1]">{draft.explanation}</p>
    </article> : null}
  </section>;
}
