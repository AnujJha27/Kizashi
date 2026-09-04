"use client";

import { useEffect, useMemo, useState } from "react";

import { pronunciationItems, pronunciationLessons } from "@/data/pronunciation-bank.js";
import { AudioControls } from "@/components/learning/audio-controls";
import { advancePronunciationProgress, pronunciationProgressStage } from "@/lib/pronunciation-core.js";
import { readPronunciationProgress, writePronunciationProgress } from "@/lib/session";

type Stage = "not-introduced" | "aware" | "discriminates" | "practised";
type Lesson = { id: string; level: "N5" | "N4"; title: string; topic: string; explanation: string; hearingExamples: string[]; listenRepeat: string; words: string[]; shortPhrases: string[]; sentenceExamples: string[]; exerciseIds: string[] };
type Item = { id: string; lessonId: string; prompt: string; options: string[]; correctIndex: number; audioText: string; explanation: string };

const lessons = pronunciationLessons as unknown as Lesson[];
const items = pronunciationItems as unknown as Item[];
const stageLabel: Record<Stage, string> = { "not-introduced": "Not introduced", aware: "Aware", discriminates: "Discriminates", practised: "Practised" };

export function PronunciationActivity() {
  const [lessonId, setLessonId] = useState(lessons[0]?.id ?? "");
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [progress, setProgress] = useState<Record<string, Stage>>({});
  const lesson = lessons.find((entry) => entry.id === lessonId) ?? lessons[0];
  const lessonItems = useMemo(() => items.filter((item) => item.lessonId === lesson?.id), [lesson?.id]);
  const item = lessonItems[position % Math.max(lessonItems.length, 1)];
  const correct = selected === item?.correctIndex;

  useEffect(() => {
    setProgress(readPronunciationProgress() as Record<string, Stage>);
  }, []);

  useEffect(() => {
    if (!lesson) return;
    setProgress((current) => {
      const next = { ...current, [lesson.id]: advancePronunciationProgress(current[lesson.id], "aware") as Stage };
      writePronunciationProgress(next);
      return next;
    });
  }, [lesson]);

  const chooseLesson = (value: string) => { setLessonId(value); setPosition(0); setSelected(null); setSubmitted(false); };
  const submit = () => {
    if (selected === null || submitted || !item || !lesson) return;
    setSubmitted(true);
    if (correct) {
      setProgress((current) => {
        const complete = position >= lessonItems.length - 1;
        const next = { ...current, [lesson.id]: advancePronunciationProgress(current[lesson.id], complete ? "practised" : "discriminates") as Stage };
        writePronunciationProgress(next);
        return next;
      });
    }
  };
  const next = () => { setPosition((value) => (value + 1) % Math.max(lessonItems.length, 1)); setSelected(null); setSubmitted(false); };

  if (!lesson || !item) return null;
  const currentStage = pronunciationProgressStage(progress[lesson.id]) as Stage;

  return <section className="border-t border-white/10 pt-7" aria-labelledby="pronunciation-title"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">発音 · Pronunciation</p><h2 id="pronunciation-title" className="mt-1 text-2xl font-medium">Hear the shape of Japanese.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#9297a1]">Build awareness of timing, sound combinations, rhythm, and intonation through short listening choices. This track is separate from JLPT readiness.</p></div><a href="https://www.gavo.t.u-tokyo.ac.jp/ojad/eng/pages/home" target="_blank" rel="noreferrer" className="shrink-0 text-xs font-semibold text-[#e5b85c] hover:text-[#f1cf7c]">Explore OJAD ↗</a></div><div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,.7fr)]"><div className="surface-panel p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">{lesson.level} · {lesson.topic}</p><h3 className="mt-2 text-xl font-medium text-[#f5f5f2]">{lesson.title}</h3></div><span className="rounded-full border border-[#3f4652] px-2.5 py-1 text-[10px] text-[#e5b85c]">{stageLabel[currentStage]}</span></div><p className="mt-4 text-sm leading-6 text-[#c3c7ce]">{lesson.explanation}</p><div className="mt-4 rounded-lg border border-white/10 bg-[#101b2b]/55 p-3"><p className="eyebrow">Listen & repeat</p><p className="mt-2 jp-serif text-lg text-[#f5f5f2]">{lesson.listenRepeat}</p><AudioControls text={lesson.listenRepeat} className="mt-3" /></div><AudioControls text={item.audioText} className="mt-5" /><p className="mt-5 jp-serif text-lg leading-8 text-[#f5f5f2]">{item.prompt}</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{item.options.map((option, index) => <button key={`${item.id}-${index}`} type="button" onClick={() => !submitted && setSelected(index)} disabled={submitted} aria-pressed={selected === index} className={`rounded-lg border px-3 py-3 text-left text-sm ${selected === index ? "border-[#e34a3f] bg-[#3a2023] text-[#f5f5f2]" : "border-white/10 bg-[#17181d]/70 text-[#c3c7ce] hover:border-[#e5b85c]"}`}>{option}</button>)}</div><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={selected === null || submitted} onClick={submit} className="rounded-lg bg-[#e5b85c] px-4 py-2.5 text-xs font-semibold text-[#0b0b0d] disabled:opacity-40">Check</button>{submitted ? <button type="button" onClick={next} className="rounded-lg border border-[#e5b85c] px-4 py-2.5 text-xs font-semibold text-[#f1cf7c]">Next exercise →</button> : null}</div>{submitted ? <p className={`mt-4 text-sm ${correct ? "text-[#8bcca6]" : "text-[#ef675d]"}`} role="status">{correct ? "Good listening." : "Not quite."} {item.explanation}</p> : null}<p className="mt-4 text-[11px] text-[#676c75]">Exercise {position + 1} of {lessonItems.length} · listen, choose, then say the phrase once.</p></div><aside className="border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"><label className="eyebrow block" htmlFor="pronunciation-lesson">Lesson sequence</label><select id="pronunciation-lesson" value={lesson.id} onChange={(event) => chooseLesson(event.target.value)} className="mt-2 w-full rounded-lg border border-[#3f4652] bg-[#111216] px-3 py-2 text-sm text-[#f5f5f2]"><optgroup label="N5 foundation">{lessons.filter((entry) => entry.level === "N5").map((entry) => <option key={entry.id} value={entry.id}>{entry.title}</option>)}</optgroup><optgroup label="N4 reinforcement">{lessons.filter((entry) => entry.level === "N4").map((entry) => <option key={entry.id} value={entry.id}>{entry.title}</option>)}</optgroup></select><div className="mt-5 border-y border-white/10 py-4"><p className="eyebrow">Separate progress</p><p className="mt-2 text-2xl font-medium text-[#e5b85c]">{stageLabel[currentStage]}</p><p className="mt-1 text-xs leading-5 text-[#9297a1]">Opening a lesson creates awareness. Correct discrimination moves it forward; one pass never claims mastery.</p></div><div className="mt-5"><p className="eyebrow">Hearing examples</p><p className="mt-2 text-sm leading-6 text-[#c3c7ce]">{lesson.hearingExamples.join(" · ")}</p><p className="eyebrow mt-4">Lesson material</p><ul className="mt-3 space-y-2 text-sm text-[#c3c7ce]"><li>Words · {lesson.words.join(" · ")}</li><li>Short phrases · {lesson.shortPhrases.join(" · ")}</li><li>Sentence examples · {lesson.sentenceExamples.join(" · ")}</li></ul></div></aside></div></section>;
}
