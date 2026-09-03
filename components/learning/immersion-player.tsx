"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useContentModule } from "@/components/content/use-content-module";
import { AudioControls } from "@/components/learning/audio-controls";
import { JapaneseText } from "@/components/learning/japanese-text";
import { ReadingPanel } from "@/components/learning/reading-panel";
import { readExternalSourceProgress } from "@/lib/external-source-progress.js";
import { getImmersionReason, getEarWarmup, getListeningClipMetadata, selectImmersionClips } from "@/lib/immersion-core.js";
import { readMistakes, readReviewRecords, type MistakeRecord, type ReviewRecord, writeContinueState } from "@/lib/session";
import type { ListeningItem, ListeningMode, ReadingItem } from "@/lib/types";

function knownIds(records: Record<string, ReviewRecord>) {
  return new Set(Object.keys(records));
}

function coverageLabel(value: number) {
  return value ? `${Math.round(value * 100)}% familiar` : "coverage pending";
}

export function ImmersionPlayer({ clipId, readingId, focus = "listen", startMode = "guided", startShadowing = false, onClose }: Readonly<{ clipId?: string; readingId?: string; focus?: "listen" | "read"; startMode?: ListeningMode; startShadowing?: boolean; onClose: () => void }>) {
  const module = useContentModule();
  const [records, setRecords] = useState<Record<string, ReviewRecord>>({});
  const [mistakes, setMistakes] = useState<Record<string, MistakeRecord>>({});
  const [mode, setMode] = useState<ListeningMode>(startMode);
  const [warmup, setWarmup] = useState(false);
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [shadowing, setShadowing] = useState(startShadowing);
  const [phrasePosition, setPhrasePosition] = useState(0);
  const [speakingAlone, setSpeakingAlone] = useState(false);
  const [readingPosition, setReadingPosition] = useState(0);
  const [readingSelected, setReadingSelected] = useState<number | null>(null);
  const [readingSubmitted, setReadingSubmitted] = useState(false);
  const initialClipId = useRef(clipId);
  const initialReadingId = useRef(readingId);

  useEffect(() => {
    const refresh = () => { setRecords(readReviewRecords()); setMistakes(readMistakes()); };
    refresh();
    window.addEventListener("michi-review-updated", refresh);
    window.addEventListener("michi-mistakes-updated", refresh);
    return () => { window.removeEventListener("michi-review-updated", refresh); window.removeEventListener("michi-mistakes-updated", refresh); };
  }, []);

  const known = useMemo(() => knownIds(records), [records]);
  const warmupClips = useMemo(() => getEarWarmup(module.listening, known), [known, module.listening]);
  const sourceProgress = useMemo(() => readExternalSourceProgress(), []);
  const clips = useMemo(() => warmup ? warmupClips : selectImmersionClips(module.listening, mode, known, 12, { mistakes, sourceProgress }), [known, mode, module.listening, mistakes, sourceProgress, warmup, warmupClips]);
  const clipIds = clips.map((clip) => clip.id).join("|");
  const clip = clips[position] as ListeningItem | undefined;
  const metadata = clip ? getListeningClipMetadata(clip, new Map([...module.vocabulary, ...module.grammar, ...module.kanji].map((item) => [item.id, item])), known) : null;
  const question = clip?.questions?.[0];
  const reading = module.readings[readingPosition % Math.max(module.readings.length, 1)] as ReadingItem | undefined;
  const readingQuestion = reading?.questions?.[0];
  const phrases = clip?.transcript.split(/\n+/u).map((phrase) => phrase.trim()).filter(Boolean) ?? [];
  const phrase = phrases[phrasePosition] ?? phrases[0] ?? clip?.transcript ?? "";
  const transcriptVisible = mode === "guided" || showTranscript || shadowing;

  useEffect(() => {
    if (focus === "read" && reading) writeContinueState({ kind: "reading", href: "/immersion", label: reading.title, detail: "Reading activity", referenceId: reading.id });
    if (focus === "listen" && clip) writeContinueState({ kind: "immersion", href: "/immersion", label: clip.title, detail: "Listening activity", referenceId: clip.id });
  }, [clip?.id, clip?.title, focus, reading?.id, reading?.title]);

  useEffect(() => {
    const requestedClipPosition = initialClipId.current ? clips.findIndex((entry) => entry.id === initialClipId.current) : -1;
    const requestedReadingPosition = initialReadingId.current ? module.readings.findIndex((entry) => entry.id === initialReadingId.current) : -1;
    setPosition(requestedClipPosition >= 0 ? requestedClipPosition : 0);
    setReadingPosition(requestedReadingPosition >= 0 ? requestedReadingPosition : 0);
    initialClipId.current = undefined;
    initialReadingId.current = undefined;
    setSelected(null);
    setSubmitted(false);
    setShowTranscript(false);
    setPhrasePosition(0);
    setSpeakingAlone(false);
    setReadingSelected(null);
    setReadingSubmitted(false);
  }, [clipIds, clips, module.readings]);

  const next = () => {
    if (position >= clips.length - 1) setPosition(0);
    else setPosition((value) => value + 1);
    setSelected(null);
    setSubmitted(false);
    setShowTranscript(false);
    setPhrasePosition(0);
    setSpeakingAlone(false);
  };
  const nextReading = () => {
    setReadingPosition((value) => (value + 1) % Math.max(module.readings.length, 1));
    setReadingSelected(null);
    setReadingSubmitted(false);
  };

  if (focus === "listen" && (!clip || !metadata || !question)) return <div className="surface-panel p-6"><button type="button" onClick={onClose} className="mb-5 rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce]">← Back to immersion</button><p className="eyebrow">聞く · Listen</p><p className="mt-2 text-sm text-[#c3c7ce]">Listening material is not available yet.</p></div>;
  if (focus === "read" && (!reading || !readingQuestion)) return <div className="surface-panel p-6"><button type="button" onClick={onClose} className="mb-5 rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce]">← Back to immersion</button><p className="eyebrow">読む · Read</p><p className="mt-2 text-sm text-[#c3c7ce]">Reading material is not available yet.</p></div>;

  return <div className="space-y-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">Immersion · activity</p><p className="mt-1 text-sm text-[#9297a1]">A focused place to listen, read, and respond.</p></div><button type="button" onClick={onClose} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#e5b85c]">← Back to immersion</button></div>
    {focus === "read" ? <section className="surface-panel overflow-hidden p-6 sm:p-9"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">読む · Reading activity</p><h2 className="mt-1 text-2xl font-medium text-[#f5f5f2]"><JapaneseText text={reading!.title} vocabulary={module.vocabulary} kanji={module.kanji} always inspect={false} /></h2><p className="mt-1 text-xs text-[#9297a1]">Read the passage first; the question stays with its context.</p></div><button type="button" onClick={nextReading} className="rounded-lg border border-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#f1cf7c]">Next passage →</button></div><div className="mt-6 rounded-xl border border-white/10 bg-[#101b2b]/50 p-4"><ReadingPanel item={reading!} vocabulary={module.vocabulary} kanji={module.kanji} always /></div><div className="mt-6 rounded-xl border border-[#3f4652] bg-[#101b2b]/45 p-4"><p className="jp-serif text-sm text-[#f5f5f2]"><JapaneseText text={readingQuestion!.prompt} vocabulary={module.vocabulary} kanji={module.kanji} always /></p><div className="mt-3 grid gap-2 sm:grid-cols-2">{readingQuestion!.options.map((answer, index) => <button key={`${answer}-${index}`} type="button" onClick={() => !readingSubmitted && setReadingSelected(index)} disabled={readingSubmitted} aria-pressed={readingSelected === index} className={`jp-serif rounded-lg border px-3 py-2.5 text-left text-sm ${readingSelected === index ? "border-[#e34a3f] bg-[#3a2023] text-[#f5f5f2]" : "border-white/10 bg-[#17181d]/70 text-[#c3c7ce] hover:border-[#e5b85c]"}`}><JapaneseText text={answer} vocabulary={module.vocabulary} kanji={module.kanji} always inspect={false} /></button>)}</div><button type="button" disabled={readingSelected === null || readingSubmitted} onClick={() => setReadingSubmitted(true)} className="mt-4 rounded-lg bg-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#0b0b0d] disabled:opacity-40">Answer</button>{readingSubmitted ? <p className={`mt-3 text-sm ${readingSelected === readingQuestion!.correctAnswer ? "text-[#8bcca6]" : "text-[#ef675d]"}`} role="status">{readingSelected === readingQuestion!.correctAnswer ? "Correct." : `Not quite. ${readingQuestion!.explanation ?? reading!.translation}`}</p> : null}</div></section> : null}
    {focus === "listen" && clip && metadata && question ? <><section className="surface-panel overflow-hidden p-6 sm:p-9"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">{metadata.context} · {metadata.naturalness} speech</p><h2 className="mt-1 text-2xl font-medium text-[#f5f5f2]"><JapaneseText text={clip.title} vocabulary={module.vocabulary} kanji={module.kanji} always inspect={false} /></h2><p className="mt-2 text-xs text-[#e5b85c]">{getImmersionReason(clip, known, mistakes)}</p></div><div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[.12em] text-[#676c75]"><span>{metadata.source}</span><span>{metadata.level}</span><span>{coverageLabel(Math.max(metadata.vocabularyCoverage, metadata.grammarCoverage))}</span></div></div><div className="mt-6 flex flex-wrap gap-2"><button type="button" onClick={() => { setWarmup(true); setMode("guided"); }} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce]">耳慣らし</button>{(["guided", "listen", "immersion"] as ListeningMode[]).map((value) => <button key={value} type="button" onClick={() => { setMode(value); setWarmup(false); }} className={`rounded-lg px-3 py-2 text-xs capitalize ${!warmup && mode === value ? "bg-[#e5b85c] text-[#0b0b0d]" : "border border-[#3f4652] text-[#9297a1] hover:border-[#e5b85c]"}`}>{value}</button>)}</div><AudioControls text={clip.transcript} externalUrl={clip.audioUrl} metadata={clip.audio} className="mt-6" />{transcriptVisible ? <div className="mt-6 rounded-xl border border-white/10 bg-[#101b2b]/70 p-4"><p className="eyebrow mb-2">Transcript</p><p className="jp-serif whitespace-pre-line text-lg leading-8 text-[#f5f5f2]"><JapaneseText text={clip.transcript} vocabulary={module.vocabulary} kanji={module.kanji} always /></p></div> : <div className="mt-6 rounded-xl border border-[#3f4652] bg-[#101b2b]/40 p-4 text-sm text-[#9297a1]">Audio first. Try the question before revealing the transcript.</div>}<div className="mt-7 rounded-xl border border-[#3f4652] bg-[#101b2b]/45 p-4"><p className="jp-serif text-sm text-[#f5f5f2]"><JapaneseText text={question.prompt} vocabulary={module.vocabulary} kanji={module.kanji} always /></p><div className="mt-3 grid gap-2 sm:grid-cols-2">{question.answers.map((answer, index) => <button key={`${answer}-${index}`} type="button" onClick={() => !submitted && setSelected(index)} disabled={submitted} aria-pressed={selected === index} className={`jp-serif rounded-lg border px-3 py-2.5 text-left text-sm ${selected === index ? "border-[#e34a3f] bg-[#3a2023] text-[#f5f5f2]" : "border-white/10 bg-[#17181d]/70 text-[#c3c7ce] hover:border-[#e5b85c]"}`}><JapaneseText text={answer} vocabulary={module.vocabulary} kanji={module.kanji} always inspect={false} /></button>)}</div><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={selected === null || submitted} onClick={() => setSubmitted(true)} className="rounded-lg bg-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#0b0b0d] disabled:opacity-40">Answer</button>{mode !== "guided" && submitted && !showTranscript ? <button type="button" onClick={() => setShowTranscript(true)} className="rounded-lg border border-[#3f4652] px-3 py-2.5 text-xs text-[#c3c7ce]">Show transcript</button> : null}</div>{submitted ? <p className={`mt-3 text-sm ${selected === question.correctAnswer ? "text-[#8bcca6]" : "text-[#ef675d]"}`} role="status">{selected === question.correctAnswer ? "Correct." : `Not quite. ${question.explanation ?? "Review the transcript and try the pattern again."}`}</p> : null}</div><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={() => { setShadowing((value) => !value); setShowTranscript(true); }} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce]">{shadowing ? "Close shadowing" : "Shadow this clip"}</button>{submitted ? <button type="button" onClick={next} className="rounded-lg border border-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#f1cf7c]">Next clip →</button> : null}</div>{shadowing ? <div className="mt-5 rounded-xl border border-[#315d4b] bg-[#162b26]/60 p-4"><p className="eyebrow">Shadowing · phrase {phrasePosition + 1} / {Math.max(phrases.length, 1)}</p><p className="jp-serif mt-3 text-xl text-[#f5f5f2]"><JapaneseText text={phrase} vocabulary={module.vocabulary} kanji={module.kanji} always /></p><AudioControls text={phrase} className="mt-3" /><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setPhrasePosition((value) => Math.min(value + 1, Math.max(phrases.length - 1, 0)))} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce]">Next phrase</button><button type="button" onClick={() => setSpeakingAlone((value) => !value)} className="rounded-lg bg-[#6fb98f] px-3 py-2 text-xs font-semibold text-[#0b0b0d]">{speakingAlone ? "I said it" : "Speak alone"}</button></div>{speakingAlone ? <p className="mt-3 text-xs text-[#8bcca6]" role="status">Your turn—say the phrase, then tap “I said it” to continue.</p> : <p className="mt-3 text-xs leading-5 text-[#9297a1]">Listen, shadow along, or speak alone. Audio stays external/browser-based; Kizashi does not record your voice.</p>}</div> : null}</section>{reading && readingQuestion ? <section className="surface-panel p-6 sm:p-9"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">読む · Reading drill</p><h3 className="mt-1 text-2xl font-medium text-[#f5f5f2]"><JapaneseText text={reading.title} vocabulary={module.vocabulary} kanji={module.kanji} always inspect={false} /></h3></div><button type="button" onClick={nextReading} className="rounded-lg border border-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#f1cf7c]">Next passage →</button></div><div className="mt-6 rounded-xl border border-white/10 bg-[#101b2b]/50 p-4"><ReadingPanel item={reading} vocabulary={module.vocabulary} kanji={module.kanji} /></div><div className="mt-6 rounded-xl border border-[#3f4652] bg-[#101b2b]/45 p-4"><p className="jp-serif text-sm text-[#f5f5f2]"><JapaneseText text={readingQuestion.prompt} vocabulary={module.vocabulary} kanji={module.kanji} always /></p><div className="mt-3 grid gap-2 sm:grid-cols-2">{readingQuestion.options.map((answer, index) => <button key={`${answer}-${index}`} type="button" onClick={() => !readingSubmitted && setReadingSelected(index)} disabled={readingSubmitted} aria-pressed={readingSelected === index} className={`jp-serif rounded-lg border px-3 py-2.5 text-left text-sm ${readingSelected === index ? "border-[#e34a3f] bg-[#3a2023] text-[#f5f5f2]" : "border-white/10 bg-[#17181d]/70 text-[#c3c7ce] hover:border-[#e5b85c]"}`}><JapaneseText text={answer} vocabulary={module.vocabulary} kanji={module.kanji} always inspect={false} /></button>)}</div><button type="button" disabled={readingSelected === null || readingSubmitted} onClick={() => setReadingSubmitted(true)} className="mt-4 rounded-lg bg-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#0b0b0d] disabled:opacity-40">Answer</button>{readingSubmitted ? <p className={`mt-3 text-sm ${readingSelected === readingQuestion.correctAnswer ? "text-[#8bcca6]" : "text-[#ef675d]"}`} role="status">{readingSelected === readingQuestion.correctAnswer ? "Correct." : `Not quite. ${readingQuestion.explanation ?? reading.translation}`}</p> : null}</div></section> : null}</> : null}
  </div>;
}
