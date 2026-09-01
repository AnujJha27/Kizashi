"use client";

import { useEffect, useMemo, useState } from "react";

import { useContentModule } from "@/components/content/use-content-module";
import { AudioControls } from "@/components/learning/audio-controls";
import { ExternalSourceFrame, ExternalSourceViewer } from "@/components/learning/external-source-viewer";
import { JapaneseText } from "@/components/learning/japanese-text";
import { externalResourceToSourceLink } from "@/components/learning/external-source-launcher";
import { readExternalSourceProgress } from "@/lib/external-source-progress.js";
import { getEarWarmup, getListeningClipMetadata, selectImmersionClips } from "@/lib/immersion-core.js";
import { readReviewRecords, type ReviewRecord } from "@/lib/session";
import type { ListeningItem, ListeningMode } from "@/lib/types";
import { getErinLessonResources, getExternalResources } from "@/lib/external-resources";

const erinLessons = getErinLessonResources().map(externalResourceToSourceLink);
const sources = getExternalResources().filter((resource) => resource.id === "erin" || resource.resourceType === "listening").map(externalResourceToSourceLink);

function knownIds(records: Record<string, ReviewRecord>) {
  return new Set(Object.keys(records));
}

function coverageLabel(value: number) {
  return value ? `${Math.round(value * 100)}% familiar` : "coverage pending";
}

export function ImmersionSurface() {
  const module = useContentModule();
  const [records, setRecords] = useState<Record<string, ReviewRecord>>({});
  const [mode, setMode] = useState<ListeningMode>("guided");
  const [warmup, setWarmup] = useState(false);
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [shadowing, setShadowing] = useState(false);
  const [phrasePosition, setPhrasePosition] = useState(0);
  const [speakingAlone, setSpeakingAlone] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedErinId, setSelectedErinId] = useState(erinLessons[0]?.id ?? "");
  const [sourceProgress, setSourceProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const refresh = () => setRecords(readReviewRecords());
    refresh();
    window.addEventListener("michi-review-updated", refresh);
    return () => window.removeEventListener("michi-review-updated", refresh);
  }, []);

  useEffect(() => {
    const refresh = () => setSourceProgress(readExternalSourceProgress());
    refresh();
    window.addEventListener("michi-source-progress-updated", refresh);
    return () => window.removeEventListener("michi-source-progress-updated", refresh);
  }, []);

  const known = useMemo(() => knownIds(records), [records]);
  const itemMap = useMemo(() => new Map([...module.vocabulary, ...module.grammar, ...module.kanji].map((item) => [item.id, item])), [module.grammar, module.kanji, module.vocabulary]);
  const warmupClips = useMemo(() => getEarWarmup(module.listening, known), [known, module.listening]);
  const clips = useMemo(() => warmup ? warmupClips : selectImmersionClips(module.listening, mode, known, 12), [known, mode, module.listening, warmup, warmupClips]);
  const clipIds = clips.map((clip) => clip.id).join("|");
  const clip = clips[position] as ListeningItem | undefined;
  const metadata = clip ? getListeningClipMetadata(clip, itemMap, known) : null;
  const question = clip?.questions?.[0];
  const phrases = clip?.transcript.split(/\n+/u).map((phrase) => phrase.trim()).filter(Boolean) ?? [];
  const phrase = phrases[phrasePosition] ?? phrases[0] ?? clip?.transcript ?? "";
  const transcriptVisible = mode === "guided" || showTranscript || shadowing;
  const selectedSource = sources.find((source) => source.id === selectedSourceId) ?? null;
  const selectedErinSource = erinLessons.find((source) => source.id === selectedErinId) ?? erinLessons[0] ?? sources[0];
  const selectedViewerSource = selectedSource?.id === "erin" ? selectedErinSource : selectedSource;
  const trackableSourceIds = [...erinLessons.map((source) => source.id), ...sources.filter((source) => source.id !== "erin").map((source) => source.id)];
  const openedSourceCount = trackableSourceIds.filter((id) => sourceProgress[id]).length;

  useEffect(() => {
    setPosition(0);
    setSelected(null);
    setSubmitted(false);
    setShowTranscript(false);
    setPhrasePosition(0);
    setSpeakingAlone(false);
  }, [clipIds, mode, warmup]);

  const next = () => {
    if (position >= clips.length - 1) {
      setWarmup(false);
      setPosition(0);
    } else {
      setPosition((value) => value + 1);
    }
    setSelected(null);
    setSubmitted(false);
    setShowTranscript(false);
    setPhrasePosition(0);
    setSpeakingAlone(false);
  };

  if (!clip || !metadata || !question) return <div className="rounded-xl border border-[#4b3a29] bg-[#211d18]/70 p-6"><p className="eyebrow">聞く · Listen</p><p className="mt-2 text-sm text-[#c3c7ce]">Listening material is not available yet.</p><p className="mt-2 text-xs leading-5 text-[#9297a1]">Use Browser Speech for lesson examples while reviewed natural-dialogue clips are added.</p></div>;

  return <div className="space-y-7">
    <section className="rounded-xl border border-[#4b3a29] bg-[#211d18]/70 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Immersion · 聞く</p><h2 className="mt-1 text-2xl font-medium text-[#f5f5f2]">Hear Japanese where it lives.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#9297a1]">Browser speech supports pronunciation. This space is for situational listening, delayed help, and gradually less assistance.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setWarmup(true); setMode("guided"); }} className="rounded-xl bg-[#e34a3f] px-4 py-3 text-sm font-semibold text-[#0b0b0d] hover:bg-[#ef675d]">Start 耳慣らし · 2 min</button><span className="self-center text-xs text-[#676c75]">{position + 1} / {clips.length}</span></div></div>
      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Listening mode">{(["guided", "listen", "immersion"] as ListeningMode[]).map((value) => <button key={value} type="button" onClick={() => { setMode(value); setWarmup(false); }} className={`rounded-lg px-3 py-2 text-xs capitalize ${!warmup && mode === value ? "bg-[#e5b85c] text-[#0b0b0d]" : "border border-[#3f4652] text-[#9297a1] hover:border-[#e5b85c]"}`}>{value}</button>)}</div>
      {warmup ? <p className="mt-3 text-xs text-[#e5b85c]">Ear warm-up: one understandable clip, one stretch, then one normal-speed clip. Full understanding is not required.</p> : null}
    </section>

    <section className="surface-panel overflow-hidden p-6 sm:p-9">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">{metadata.context} · {metadata.naturalness} speech</p><h3 className="mt-1 text-2xl font-medium text-[#f5f5f2]">{clip.title}</h3></div><div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[.12em] text-[#676c75]"><span>{metadata.source}</span><span>{metadata.level}</span><span>{coverageLabel(Math.max(metadata.vocabularyCoverage, metadata.grammarCoverage))}</span></div></div>
      <AudioControls text={clip.transcript} externalUrl={clip.audioUrl} metadata={clip.audio} className="mt-6" />
      {transcriptVisible ? <div className="mt-6 rounded-xl border border-white/10 bg-[#101b2b]/70 p-4"><p className="eyebrow mb-2">Transcript</p><p className="jp-serif whitespace-pre-line text-lg leading-8 text-[#f5f5f2]"><JapaneseText text={clip.transcript} vocabulary={module.vocabulary} kanji={module.kanji} always /></p></div> : <div className="mt-6 rounded-xl border border-[#3f4652] bg-[#101b2b]/40 p-4 text-sm text-[#9297a1]">Audio first. Try the question before revealing the transcript.</div>}
      <div className="mt-7 rounded-xl border border-[#3f4652] bg-[#101b2b]/45 p-4"><p className="text-sm text-[#f5f5f2]">{question.prompt}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{question.answers.map((answer, index) => <button key={`${answer}-${index}`} type="button" onClick={() => !submitted && setSelected(index)} disabled={submitted} aria-pressed={selected === index} className={`rounded-lg border px-3 py-2.5 text-left text-sm ${selected === index ? "border-[#e34a3f] bg-[#3a2023] text-[#f5f5f2]" : "border-white/10 bg-[#17181d]/70 text-[#c3c7ce] hover:border-[#e5b85c]"}`}>{answer}</button>)}</div><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={selected === null || submitted} onClick={() => setSubmitted(true)} className="rounded-lg bg-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#0b0b0d] disabled:cursor-not-allowed disabled:opacity-40">Answer</button>{mode !== "guided" && submitted && !showTranscript ? <button type="button" onClick={() => setShowTranscript(true)} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#e5b85c]">Show transcript</button> : null}</div>{submitted ? <p className={`mt-3 text-sm ${selected === question.correctAnswer ? "text-[#8bcca6]" : "text-[#ef675d]"}`} role="status">{selected === question.correctAnswer ? "Correct." : `Not quite. ${question.explanation ?? "Review the transcript and try the pattern again."}`}</p> : null}</div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={() => { setShadowing((value) => !value); setShowTranscript(true); }} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#e5b85c]">{shadowing ? "Close shadowing" : "Shadow this clip"}</button>{submitted ? <button type="button" onClick={next} className="rounded-lg border border-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#f1cf7c] hover:bg-[#302818]">Next clip →</button> : null}</div>
      {shadowing ? <div className="mt-5 rounded-xl border border-[#315d4b] bg-[#162b26]/60 p-4"><p className="eyebrow">Shadowing · phrase {phrasePosition + 1} / {Math.max(phrases.length, 1)}</p><p className="jp-serif mt-3 text-xl text-[#f5f5f2]"><JapaneseText text={phrase} vocabulary={module.vocabulary} kanji={module.kanji} always /></p><AudioControls text={phrase} className="mt-3" /><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setPhrasePosition((value) => Math.min(value + 1, Math.max(phrases.length - 1, 0)))} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#e5b85c]">Next phrase</button><button type="button" onClick={() => setSpeakingAlone((value) => !value)} className="rounded-lg bg-[#6fb98f] px-3 py-2 text-xs font-semibold text-[#0b0b0d]">{speakingAlone ? "I said it" : "Speak alone"}</button></div>{speakingAlone ? <p className="mt-3 text-xs text-[#8bcca6]" role="status">Your turn—say the phrase, then tap “I said it” to continue.</p> : <p className="mt-3 text-xs leading-5 text-[#9297a1]">Listen, shadow along, or speak alone. Audio stays external/browser-based; Kizashi does not record your voice.</p>}</div> : null}
    </section>

    <section className="rounded-xl border border-white/10 bg-[#101b2b]/55 p-5 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">聞く · LISTEN</p><h3 className="mt-1 text-xl font-medium text-[#f5f5f2]">Natural listening, kept with the source.</h3><p className="mt-1 max-w-2xl text-xs leading-5 text-[#9297a1]">Erin, corpus, and human-voice sources stay provider-hosted. Reading, practical practice, and grammar references appear in their own learner context below or on the relevant lesson.</p></div><span className="text-xs text-[#9297a1]">Sources opened · {openedSourceCount} / {trackableSourceIds.length}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{sources.map((source) => <article key={source.id} className="rounded-xl border border-white/10 bg-[#17181d]/70 p-4"><p className="text-sm font-medium text-[#f5f5f2]">{source.title ?? source.name}</p><p className="mt-1 text-xs uppercase tracking-[.1em] text-[#676c75]">{source.name}{source.level ? ` · ${source.level}` : ""}{source.context ? ` · ${source.context}` : ""}</p><p className="mt-1 text-xs leading-5 text-[#9297a1]">{source.description}</p>{source.targetSkills?.length ? <p className="mt-2 text-[11px] text-[#e5b85c]">Target: {source.targetSkills.join(" · ")}</p> : null}{source.targetItemIds?.length ? <p className="mt-1 text-[10px] leading-4 text-[#9297a1]">Maps to: {source.targetItemIds.join(" · ")}</p> : null}{source.resourceTypes?.length ? <p className="mt-1 text-[10px] leading-4 text-[#9297a1]">On source: {source.resourceTypes.join(" · ")}</p> : null}{source.id === "erin" ? <label className="mt-3 block text-xs text-[#9297a1]"><span className="mr-2">Lesson</span><select value={selectedErinSource.id} onChange={(event) => setSelectedErinId(event.target.value)} className="mt-1 w-full rounded-lg border border-[#3f4652] bg-[#101b2b] px-3 py-2 text-xs text-[#f5f5f2]">{erinLessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}</select></label> : null}<ExternalSourceViewer source={source.id === "erin" ? selectedErinSource : source} open={selectedSourceId === source.id} onToggle={() => setSelectedSourceId((value) => value === source.id ? null : value)} /></article>)}</div>{selectedViewerSource ? <ExternalSourceFrame source={selectedViewerSource} /> : null}</section>
  </div>;
}
