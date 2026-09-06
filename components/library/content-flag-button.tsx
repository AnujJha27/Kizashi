"use client";

import { useEffect, useState } from "react";

import { CONTENT_FLAG_REASONS, readContentFlags, readContentReview, setContentCorrection, setContentReview, toggleContentFlag } from "@/lib/content-flags.js";
import { getContentReviewStatus } from "@/lib/content-validation";
import { readShowProvisionalReviewControls } from "@/lib/session";

export function ContentFlagButton({ itemId, compact = false }: Readonly<{ itemId: string; compact?: boolean }>) {
  const [flagged, setFlagged] = useState(false);

  useEffect(() => {
    const refresh = () => setFlagged(Boolean(readContentFlags()[itemId]));
    refresh();
    window.addEventListener("michi-content-flagged-updated", refresh);
    return () => window.removeEventListener("michi-content-flagged-updated", refresh);
  }, [itemId]);

  return <button type="button" aria-pressed={flagged} onClick={() => setFlagged(toggleContentFlag(itemId))} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${flagged ? "border-[#e34a3f] bg-[#3a2023] text-[#ef675d]" : "border-[#3f4652] text-[#9297a1] hover:border-[#e5b85c] hover:text-[#f1cf7c]"}`}>{flagged ? "Flagged" : compact ? "Flag content" : "Flag content for review"}</button>;
}

type ReviewOrigin = "learn" | "practice" | "library" | "reading" | "kanji-writing" | "mistake-repair";
type ReviewCategory = "vocabulary" | "kanji" | "grammar" | "reading" | "listening" | "question";

const categoryReason: Record<ReviewCategory, string> = {
  vocabulary: "Flag usage",
  kanji: "Flag word mapping",
  grammar: "Flag pattern",
  reading: "Flag passage",
  listening: "Flag transcript",
  question: "Flag question",
};

export function ContentReviewControls({ itemId, category, reviewStatus, tags, origin, question = false, editValue = "" }: Readonly<{ itemId: string; category: ReviewCategory; reviewStatus?: unknown; tags?: unknown; origin: ReviewOrigin; question?: boolean; editValue?: string }>) {
  const provisional = question || getContentReviewStatus({ reviewStatus, tags }) === "pending";
  const [review, setReview] = useState(() => readContentReview(itemId));
  const [showControls, setShowControls] = useState(true);
  const [editing, setEditing] = useState(false);
  const [correction, setCorrection] = useState(editValue);
  const [reason, setReason] = useState("other");

  useEffect(() => {
    const refresh = () => setReview(readContentReview(itemId));
    refresh();
    setCorrection(editValue);
    window.addEventListener("michi-content-flagged-updated", refresh);
    return () => window.removeEventListener("michi-content-flagged-updated", refresh);
  }, [editValue, itemId]);

  useEffect(() => {
    const refresh = () => setShowControls(readShowProvisionalReviewControls());
    refresh();
    window.addEventListener("michi-profile-updated", refresh);
    return () => window.removeEventListener("michi-profile-updated", refresh);
  }, []);

  if (!provisional || !showControls) return null;
  const questionLabels: Record<string, string> = { correct: "Correct", ambiguous: "Ambiguous", "wrong answer": "Wrong answer", "bad distractor": "Bad distractor" };
  const reviewReason = typeof review?.flagReason === "string" ? review.flagReason : "";
  const reviewedLabel = question ? questionLabels[reviewReason] : review?.status === "reviewed" ? "Reviewed" : review?.status === "flagged" ? `Flagged · ${reviewReason || "other"}` : null;
  const mark = (status: "reviewed" | "flagged", nextReason?: string) => setReview(setContentReview(itemId, status, origin, nextReason));
  const editable = !question && ["vocabulary", "kanji", "grammar"].includes(category);
  const editLabel = category === "grammar" ? "Edit explanation" : "Edit meaning";
  const saveCorrection = () => {
    if (setContentCorrection(itemId, category, correction, origin)) setEditing(false);
  };

  return <div className="mt-4 rounded-lg border border-white/10 bg-[#101b2b]/45 p-3" data-review-origin={origin}><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-[#5d4c2c] px-2 py-1 text-[10px] text-[#e5b85c]">◌ provisional</span>{reviewedLabel ? <span className={review?.status === "flagged" ? "text-[10px] text-[#ef675d]" : "text-[10px] text-[#8bcca6]"}>{reviewedLabel}</span> : null}</div><div className="mt-3 flex flex-wrap items-center gap-2">{question ? <><button type="button" onClick={() => mark("reviewed", "correct")} className="rounded-lg border border-[#315d4b] px-3 py-2 text-xs text-[#8bcca6] hover:bg-[#183225]">Correct</button><button type="button" onClick={() => mark("flagged", "ambiguous")} className="rounded-lg border border-[#5d4c2c] px-3 py-2 text-xs text-[#e5b85c] hover:bg-[#302818]">Ambiguous</button><button type="button" onClick={() => mark("flagged", "wrong answer")} className="rounded-lg border border-[#713b37] px-3 py-2 text-xs text-[#ef675d] hover:bg-[#3a2023]">Wrong answer</button><button type="button" onClick={() => mark("flagged", "bad distractor")} className="rounded-lg border border-[#713b37] px-3 py-2 text-xs text-[#ef675d] hover:bg-[#3a2023]">Bad distractor</button></> : <><button type="button" onClick={() => mark("reviewed")} className="rounded-lg border border-[#315d4b] px-3 py-2 text-xs text-[#8bcca6] hover:bg-[#183225]">Looks good</button>{editable ? <button type="button" onClick={() => setEditing((value) => !value)} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#e5b85c]">{editLabel}</button> : null}<select aria-label={`${categoryReason[category]} reason`} value={reason} onChange={(event) => setReason(event.target.value)} className="rounded-lg border border-[#3f4652] bg-[#101b2b] px-2 py-2 text-xs text-[#c3c7ce]"><option value="other">Flag reason…</option>{CONTENT_FLAG_REASONS.map((value) => <option key={value} value={value}>{value}</option>)}</select><button type="button" onClick={() => mark("flagged", reason)} className="rounded-lg border border-[#713b37] px-3 py-2 text-xs text-[#ef675d] hover:bg-[#3a2023]">{categoryReason[category]}</button><a href={`/studio?item=${encodeURIComponent(itemId)}&kind=${category}`} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#e5b85c]">Edit in Studio</a></>}</div>{editing ? <div className="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3"><label className="min-w-0 flex-1 text-[11px] text-[#9297a1]"><span>{editLabel}</span><textarea value={correction} onChange={(event) => setCorrection(event.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-[#3f4652] bg-[#101b2b] px-3 py-2 text-xs text-[#f5f5f2] outline-none focus:border-[#e5b85c]" /></label><button type="button" onClick={saveCorrection} className="self-end rounded-lg bg-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#0b0b0d]">Save correction</button></div> : null}</div>;
}
