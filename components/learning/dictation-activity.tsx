"use client";

import { useMemo, useState } from "react";

import { AudioControls } from "@/components/learning/audio-controls";
import { JapaneseText } from "@/components/learning/japanese-text";
import { normalizeAnswer } from "@/lib/mastery.js";
import { recordMistake, recordQuestionAnswer } from "@/lib/session";
import type { KanjiItem, ListeningItem, VocabularyItem } from "@/lib/types";

export function DictationActivity({ clips, vocabulary, kanji }: Readonly<{ clips: ListeningItem[]; vocabulary: VocabularyItem[]; kanji: KanjiItem[] }>) {
  const available = useMemo(() => clips.filter((clip) => clip.transcript.trim()), [clips]);
  const [position, setPosition] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!available.length) return <section className="border-t border-white/10 pt-7"><p className="eyebrow">書き取り · Dictation</p><h2 className="mt-1 text-2xl font-medium">No dictation clips are ready yet.</h2><p className="mt-2 text-sm text-[#9297a1]">Try the listening shelf while more source material loads.</p></section>;

  const clip = available[position % available.length];
  const correct = normalizeAnswer(answer, "kana") === normalizeAnswer(clip.transcript, "kana");
  const submit = () => {
    if (!answer.trim() || submitted) return;
    recordQuestionAnswer(`${clip.id}-dictation`, correct, null, null);
    if (!correct) recordMistake(clip.id, "dictation");
    setSubmitted(true);
  };
  const next = () => { setPosition((value) => (value + 1) % available.length); setAnswer(""); setSubmitted(false); };

  return <section className="border-t border-white/10 pt-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">書き取り · Dictation</p><h2 className="mt-1 text-2xl font-medium">Hear it. Write what you hear.</h2><p className="mt-2 text-sm text-[#9297a1]">A short listening recall activity using the existing Immersion clips.</p></div><span className="text-xs text-[#9297a1]">{position + 1} / {available.length}</span></div><div className="mt-5 border-y border-white/10 py-5"><p className="text-sm text-[#9297a1]"><JapaneseText text={clip.title} vocabulary={vocabulary} kanji={kanji} always inspect={false} /> · {clip.situation}</p><AudioControls text={clip.transcript} externalUrl={clip.audioUrl} metadata={clip.audio} className="mt-4" /><label className="mt-5 block text-sm text-[#9297a1]"><span className="sr-only">Dictation answer</span><textarea value={answer} onChange={(event) => !submitted && setAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) submit(); }} disabled={submitted} placeholder="Type the Japanese you hear…" className="min-h-28 w-full resize-y rounded-xl border border-[#3f4652] bg-[#101b2b]/75 px-4 py-3 text-lg text-[#f5f5f2] outline-none placeholder:text-[#676c75] focus:border-[#e5b85c]" /></label><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={!answer.trim() || submitted} onClick={submit} className="rounded-lg bg-[#e5b85c] px-4 py-2 text-xs font-semibold text-[#0b0b0d] disabled:opacity-40">Check dictation</button>{submitted ? <button type="button" onClick={next} className="rounded-lg border border-[#e5b85c] px-4 py-2 text-xs font-semibold text-[#f1cf7c]">Next clip →</button> : null}</div>{submitted ? <div className={`mt-4 rounded-xl border p-4 ${correct ? "border-[#315d4b] bg-[#162b26]/70" : "border-[#713b37] bg-[#21191a]/70"}`} role="status"><p className={`text-sm font-semibold ${correct ? "text-[#8bcca6]" : "text-[#ef675d]"}`}>{correct ? "Correct" : "Keep listening"}</p><p className="mt-2 jp-serif text-lg leading-8 text-[#f5f5f2]"><JapaneseText text={clip.transcript} vocabulary={vocabulary} kanji={kanji} always /></p>{!correct ? <p className="mt-2 text-xs text-[#9297a1]">Compare your answer with the transcript, then try the next clip.</p> : null}</div> : <p className="mt-3 text-[11px] text-[#676c75]">Ctrl/Cmd + Enter checks your answer.</p>}</div></section>;
}
