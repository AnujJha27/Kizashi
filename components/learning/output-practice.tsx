"use client";

import { useEffect, useMemo, useState } from "react";

import { AudioControls } from "@/components/learning/audio-controls";
import { JapaneseText } from "@/components/learning/japanese-text";
import { buildOutputBanks, outputReviewId, outputReviewRating } from "@/lib/output-core.js";
import { readReviewRecords, recordReview, type ReviewRecord } from "@/lib/session";
import type { N5Module } from "@/lib/types";

type ActivityKind = "speaking" | "writing" | "pragmatics" | "chunks" | "register";
type Level = "N5" | "N4";
type Activity = {
  id: string;
  kind: ActivityKind;
  level?: Level;
  targetLevel?: Level;
  title: string;
  japanese: string;
  prompt: string;
  model: string;
  reading: string;
  hint: string;
  choices?: string[];
  answer?: number;
  target?: string[];
  sourceEvidence?: string[];
};

const kinds: Array<[ActivityKind, string]> = [["speaking", "Speak"], ["writing", "Write"], ["pragmatics", "Meaning in context"], ["chunks", "Natural phrase"], ["register", "Casual / polite"]];

export function OutputPractice({ module }: Readonly<{ module: N5Module }>) {
  const [kind, setKind] = useState<ActivityKind>("speaking");
  const [level, setLevel] = useState<Level>("N5");
  const [activityIndex, setActivityIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [choice, setChoice] = useState<number | null>(null);
  const [writing, setWriting] = useState("");
  const [rating, setRating] = useState<"again" | "close" | "got-it" | null>(null);
  const [reviewRecords, setReviewRecords] = useState<Record<string, ReviewRecord>>({});
  const banks = useMemo(() => buildOutputBanks(module), [module]);
  const activeLevel = kind === "register" ? "N5" : level;
  const activities = useMemo(() => (banks[kind] as Activity[]).filter((item) => (item.level ?? item.targetLevel) === activeLevel).sort((left, right) => {
    const leftRecord = reviewRecords[outputReviewId(left.id)];
    const rightRecord = reviewRecords[outputReviewId(right.id)];
    const leftDue = !leftRecord || leftRecord.dueAt <= Date.now();
    const rightDue = !rightRecord || rightRecord.dueAt <= Date.now();
    return Number(rightDue) - Number(leftDue) || left.id.localeCompare(right.id);
  }), [activeLevel, banks, kind, reviewRecords]);
  const activity = activities[activityIndex];

  useEffect(() => {
    const refresh = () => setReviewRecords(readReviewRecords());
    refresh();
    window.addEventListener("michi-review-updated", refresh);
    return () => window.removeEventListener("michi-review-updated", refresh);
  }, []);

  useEffect(() => {
    setActivityIndex(0);
    setRevealed(false);
    setChoice(null);
    setWriting("");
    setRating(null);
  }, [kind, level]);

  if (!activity) return null;
  const choiceCorrect = activity.answer !== undefined && choice === activity.answer;
  const selectActivity = (index: number) => { setActivityIndex(index); setRevealed(false); setChoice(null); setWriting(""); setRating(null); };
  const rate = (value: "again" | "close" | "got-it") => {
    setRating(value);
    recordReview(outputReviewId(activity.id), outputReviewRating(value), "context", `output-${activity.kind}`, 1, false);
  };

  return <section className="border-t border-white/10 pt-7">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">自分で使う · Make it yours</p><h2 className="mt-1 text-2xl font-medium">Move from recognition to use.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#9297a1]">Guided speaking, writing, pragmatic interpretation, and natural phrases from the released content bank. These build general Japanese ability and do not change your JLPT score.</p></div><span className="text-xs text-[#676c75]">Kizashi authored · self-check</span></div>
    <div className="mt-5 flex flex-wrap gap-2 border-b border-white/10 pb-3" role="tablist" aria-label="Output practice types">{kinds.map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={value === kind} onClick={() => setKind(value)} className={`rounded-lg px-3 py-2 text-xs ${value === kind ? "bg-[#e5b85c] text-[#0b0b0d]" : "border border-[#3f4652] text-[#9297a1] hover:border-[#e5b85c]"}`}>{label}</button>)}</div>
    <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Output level"><span className="text-xs text-[#676c75]">Level</span>{(kind === "register" ? ["N5"] : ["N5", "N4"]).map((value) => <button key={value} type="button" onClick={() => setLevel(value as Level)} aria-pressed={activeLevel === value} className={`rounded-lg border px-3 py-2 text-xs ${activeLevel === value ? "border-[#e5b85c] bg-[#302818] text-[#f1cf7c]" : "border-[#3f4652] text-[#9297a1] hover:border-[#e5b85c]"}`}>{value} <span className="text-[10px] opacity-70">({(banks[kind] as Activity[]).filter((item) => (item.level ?? item.targetLevel) === value).length})</span></button>)}</div>
    <div className="mt-3 flex gap-1 overflow-x-auto pb-1" aria-label="Output activities">{activities.slice(0, 12).map((entry, index) => <button key={entry.id} type="button" onClick={() => selectActivity(index)} aria-label={`Activity ${index + 1}: ${entry.title}`} aria-pressed={index === activityIndex} className={`h-2 min-w-8 rounded-full ${index === activityIndex ? "bg-[#e5b85c]" : "bg-[#3f4652]"}`} />)}</div>
    <div className="mt-5 border-l-2 border-[#e5b85c] pl-4" role="tabpanel"><p className="text-sm text-[#f5f5f2]">{activity.prompt}</p><p className="mt-4 whitespace-pre-line jp-serif text-2xl leading-relaxed text-[#f1cf7c]"><JapaneseText text={activity.japanese} vocabulary={module.vocabulary} kanji={module.kanji} always inspect={false} /></p><p className="mt-3 text-xs leading-5 text-[#9297a1]">{activity.hint}</p>
      {activity.kind === "writing" || activity.kind === "chunks" ? <label className="mt-4 block"><span className="sr-only">Your Japanese response</span><textarea value={writing} onChange={(event) => setWriting(event.target.value)} rows={3} placeholder={activity.kind === "chunks" ? "Reconstruct or use the phrase here…" : "Type your response here…"} className="w-full resize-y rounded-lg border border-[#3f4652] bg-[#101b2b]/80 px-3 py-3 text-sm text-[#f5f5f2] outline-none placeholder:text-[#676c75] focus:border-[#e5b85c]" />{activity.target ? <span className="mt-2 block text-[11px] text-[#e5b85c]">Try to include: {activity.target.join(" · ")}</span> : null}</label> : null}
      {activity.choices ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{activity.choices.map((option, index) => <button key={option} type="button" onClick={() => setChoice(index)} aria-pressed={choice === index} className={`rounded-lg border px-3 py-2 text-left text-sm ${choice === index ? index === activity.answer ? "border-[#6fb98f] bg-[#183225] text-[#c6ded2]" : "border-[#e34a3f] bg-[#21191a] text-[#f0c2bd]" : "border-[#3f4652] bg-[#101b2b]/70 text-[#c3c7ce] hover:border-[#e5b85c]"}`}><JapaneseText text={option} vocabulary={module.vocabulary} kanji={module.kanji} always inspect={false} /></button>)}</div> : null}
      <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" onClick={() => setRevealed((value) => !value)} className="rounded-lg bg-[#e5b85c] px-4 py-2.5 text-sm font-semibold text-[#0b0b0d]">{revealed ? "Hide model" : "Reveal model"}</button>{activity.kind === "speaking" || activity.kind === "writing" || activity.kind === "chunks" ? <AudioControls text={activity.model} reading={activity.reading} humanFirst /> : null}{choice !== null && activity.answer !== undefined ? <span className={`text-xs ${choiceCorrect ? "text-[#8bcca6]" : "text-[#ef675d]"}`}>{choiceCorrect ? "Good choice." : "Try the situation again."}</span> : null}</div>
      {revealed ? <div className="mt-4 rounded-lg border border-[#315d4b] bg-[#162b26]/70 p-4" aria-live="polite"><p className="eyebrow text-[#8bcca6]">Model / useful phrase</p><p className="mt-2 whitespace-pre-line jp-serif text-lg text-[#f5f5f2]"><JapaneseText text={activity.model} vocabulary={module.vocabulary} kanji={module.kanji} always inspect={false} /></p>{activity.kind === "writing" ? <p className="mt-2 text-xs text-[#9297a1]">Compare structure and target forms; this is not automatically graded.</p> : null}<div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Self-rate this activity"><span className="mr-1 text-xs text-[#9297a1]">How did it feel?</span>{([["again", "Again"], ["close", "Almost"], ["got-it", "Got it"]] as const).map(([value, label]) => <button key={value} type="button" onClick={() => rate(value)} className={`rounded-lg border px-3 py-2 text-xs ${rating === value ? "border-[#e5b85c] bg-[#302818] text-[#f1cf7c]" : "border-[#3f4652] text-[#c3c7ce] hover:border-[#e5b85c]"}`}>{label}</button>)}</div>{activity.sourceEvidence?.length ? <p className="mt-3 text-[11px] text-[#676c75]">Evidence: {activity.sourceEvidence.join(" · ")}</p> : null}</div> : null}
    </div>
  </section>;
}
