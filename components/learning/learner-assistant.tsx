"use client";

import { useState } from "react";

import { JapaneseText } from "@/components/learning/japanese-text";
import type { KanjiItem, VocabularyItem } from "@/lib/types";

type Task = "explain" | "conversation" | "writing";
type AssistResult = Record<string, unknown>;

const tasks: { value: Task; label: string }[] = [
  { value: "explain", label: "Explain" },
  { value: "conversation", label: "Conversation" },
  { value: "writing", label: "Writing" },
];

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function ResultView({ task, result, vocabulary, kanji }: Readonly<{ task: Task; result: AssistResult; vocabulary: VocabularyItem[]; kanji: KanjiItem[] }>) {
  const japanese = (value: unknown, className = "") => <JapaneseText text={text(value)} vocabulary={vocabulary} kanji={kanji} className={className} always inspect={false} />;
  if (task === "explain") return <div className="mt-5 space-y-4"><div><p className="eyebrow">Parts</p><p className="mt-2 jp-serif text-lg text-[#e5b85c]">{strings(result.segmentation).map((entry) => <span key={entry} className="mr-2">{japanese(entry)}</span>)}</p></div><div><p className="eyebrow">Grammar</p><ul className="mt-2 space-y-1 text-sm leading-6 text-[#c3c7ce]">{strings(result.grammar).map((entry) => <li key={entry}>— {japanese(entry)}</li>)}</ul></div><div className="grid gap-3 sm:grid-cols-2"><div><p className="eyebrow">Literal</p><p className="mt-1 text-sm text-[#c3c7ce]">{japanese(result.literalTranslation)}</p></div><div><p className="eyebrow">Natural</p><p className="mt-1 text-sm text-[#c3c7ce]">{japanese(result.naturalTranslation)}</p></div></div></div>;
  if (task === "conversation") return <div className="mt-5 space-y-3"><p className="jp-serif text-2xl text-[#e5b85c]">{japanese(result.reply)}</p><p className="text-sm text-[#c3c7ce]">{japanese(result.translation)}</p><div className="rounded-lg border border-white/10 bg-[#101b2b]/60 p-3"><p className="eyebrow">Your next line</p><p className="mt-1 jp-serif text-lg text-[#f5f5f2]">{japanese(result.question)}</p></div><p className="text-xs leading-5 text-[#9297a1]">Tip · {japanese(result.tip)}</p></div>;
  return <div className="mt-5 space-y-3"><div><p className="eyebrow">Suggested correction</p><p className="mt-1 jp-serif text-xl text-[#e5b85c]">{japanese(result.corrected)}</p></div><p className="text-sm leading-6 text-[#c3c7ce]">{japanese(result.explanation)}</p>{strings(result.alternatives).length ? <div><p className="eyebrow">Alternatives</p><ul className="mt-1 space-y-1 text-sm text-[#c3c7ce]">{strings(result.alternatives).map((entry) => <li key={entry}>— {japanese(entry)}</li>)}</ul></div> : null}</div>;
}

export function LearnerAssistant({ defaultText = "", itemId, vocabulary = [], kanji = [] }: Readonly<{ defaultText?: string; itemId?: string; vocabulary?: VocabularyItem[]; kanji?: KanjiItem[] }>) {
  const [task, setTask] = useState<Task>("explain");
  const [input, setInput] = useState(defaultText);
  const [result, setResult] = useState<AssistResult | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setMessage("");
    setResult(null);
    try {
      const response = await fetch("/api/learner-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task, text: input, ...(itemId ? { itemId } : {}) }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "The assistant could not respond.");
      setResult(payload.result as AssistResult);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The assistant could not respond.");
    } finally {
      setLoading(false);
    }
  };

  return <details className="mt-8 border-t border-white/10 pt-5"><summary className="cursor-pointer text-sm font-semibold text-[#e5b85c] hover:text-[#f1cf7c]">Learner assistant · explain, talk, or correct</summary><div className="mt-4 rounded-xl border border-[#315d4b] bg-[#162b26]/45 p-4"><p className="text-xs leading-5 text-[#9297a1]">Original, derived help for this study text. Verify it against the entry; it does not change curriculum facts.</p><div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Assistant mode">{tasks.map((entry) => <button key={entry.value} type="button" onClick={() => { setTask(entry.value); setResult(null); setMessage(""); }} className={`rounded-lg px-3 py-2 text-xs ${task === entry.value ? "bg-[#e5b85c] text-[#0b0b0d]" : "border border-[#3f4652] text-[#c3c7ce] hover:border-[#e5b85c]"}`}>{entry.label}</button>)}</div><label className="mt-4 block text-xs text-[#c3c7ce]">Japanese text<textarea value={input} onChange={(event) => setInput(event.target.value)} maxLength={2000} rows={4} placeholder="Paste a sentence or write your own…" className="mt-2 w-full resize-y rounded-lg border border-[#3f4652] bg-[#101b2b]/80 px-3 py-2.5 text-sm text-[#f5f5f2] outline-none placeholder:text-[#676c75] focus:border-[#e5b85c]" /></label><button type="button" disabled={!input.trim() || loading} onClick={() => void run()} className="mt-3 rounded-lg bg-[#e34a3f] px-4 py-2.5 text-xs font-semibold text-[#0b0b0d] disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Thinking…" : task === "explain" ? "Explain sentence" : task === "conversation" ? "Continue conversation" : "Check writing"}</button>{message ? <p className="mt-3 text-xs text-[#ef675d]" role="alert">{message}</p> : null}{result ? <ResultView task={task} result={result} vocabulary={vocabulary} kanji={kanji} /> : null}</div></details>;
}
