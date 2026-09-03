"use client";

import { useState } from "react";

import { AudioControls } from "@/components/learning/audio-controls";
import { JapaneseText } from "@/components/learning/japanese-text";
import type { N5Module } from "@/lib/types";

type ActivityKind = "speaking" | "writing" | "pragmatics" | "chunks";
type Activity = { kind: ActivityKind; label: string; japanese: string; prompt: string; model: string; reading: string; hint: string; choices?: string[]; answer?: number; target?: string[] };

const activities: Activity[] = [
  { kind: "speaking", label: "Speak", japanese: "カフェでコーヒーを二つ注文してください。", prompt: "You are at a café. Ask for two coffees.", model: "コーヒーを二つください。", reading: "コーヒーをふたつください。", hint: "Try saying it aloud before revealing the model." },
  { kind: "writing", label: "Write", japanese: "きのう何をしましたか。", prompt: "Write one or two Japanese sentences about yesterday. Try to use ました and one time expression.", model: "きのう、七時に起きました。それから、日本語を勉強しました。", reading: "きのう、しちじにおきました。それから、にほんごをべんきょうしました。", hint: "Self-compare with the model; other natural answers can also be correct.", target: ["ました", "time expression"] },
  { kind: "pragmatics", label: "Meaning in context", japanese: "明日、一緒に映画を見ませんか。\n明日はちょっと…", prompt: "What is the second speaker communicating?", model: "A soft decline: “Tomorrow is a little difficult…”", reading: "あしたはいっしょにえいがをみませんか。\nあしたはちょっと…", hint: "ちょっと… often leaves an uncomfortable refusal unsaid.", choices: ["They are accepting enthusiastically.", "They are declining indirectly.", "They did not hear the invitation."], answer: 1 },
  { kind: "chunks", label: "Natural phrase", japanese: "写真を＿＿。", prompt: "Choose the natural completion.", model: "写真を撮る", reading: "しゃしんをとる", hint: "Learn the whole phrase, not only the individual words.", choices: ["撮る", "飲む", "乗る", "入る"], answer: 0 },
];

export function OutputPractice({ module }: Readonly<{ module: N5Module }>) {
  const [activityIndex, setActivityIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [choice, setChoice] = useState<number | null>(null);
  const [writing, setWriting] = useState("");
  const activity = activities[activityIndex];
  const reset = (index: number) => { setActivityIndex(index); setRevealed(false); setChoice(null); setWriting(""); };
  const choiceCorrect = activity.answer !== undefined && choice === activity.answer;

  return <section className="border-t border-white/10 pt-7">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">自分で使う · Make it yours</p><h2 className="mt-1 text-2xl font-medium">Move from recognition to use.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#9297a1]">Short speaking, writing, pragmatic, and natural-phrase prompts. These build general Japanese ability and do not change your JLPT score.</p></div><span className="text-xs text-[#676c75]">Kizashi authored · self-check</span></div>
    <div className="mt-5 flex flex-wrap gap-2 border-b border-white/10 pb-3" role="tablist" aria-label="Output practice types">{activities.map((entry, index) => <button key={entry.kind} type="button" role="tab" aria-selected={index === activityIndex} onClick={() => reset(index)} className={`rounded-lg px-3 py-2 text-xs ${index === activityIndex ? "bg-[#e5b85c] text-[#0b0b0d]" : "border border-[#3f4652] text-[#9297a1] hover:border-[#e5b85c]"}`}>{entry.label}</button>)}</div>
    <div className="mt-5 border-l-2 border-[#e5b85c] pl-4" role="tabpanel"><p className="text-sm text-[#f5f5f2]">{activity.prompt}</p><p className="mt-4 whitespace-pre-line jp-serif text-2xl leading-relaxed text-[#f1cf7c]"><JapaneseText text={activity.japanese} vocabulary={module.vocabulary} kanji={module.kanji} always inspect={false} /></p><p className="mt-3 text-xs leading-5 text-[#9297a1]">{activity.hint}</p>
      {activity.kind === "writing" ? <label className="mt-4 block"><span className="sr-only">Your Japanese response</span><textarea value={writing} onChange={(event) => setWriting(event.target.value)} rows={3} placeholder="Type your response here…" className="w-full resize-y rounded-lg border border-[#3f4652] bg-[#101b2b]/80 px-3 py-3 text-sm text-[#f5f5f2] outline-none placeholder:text-[#676c75] focus:border-[#e5b85c]" />{activity.target ? <span className="mt-2 block text-[11px] text-[#e5b85c]">Try to include: {activity.target.join(" · ")}</span> : null}</label> : null}
      {activity.choices ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{activity.choices.map((option, index) => <button key={option} type="button" onClick={() => setChoice(index)} aria-pressed={choice === index} className={`rounded-lg border px-3 py-2 text-left text-sm ${choice === index ? index === activity.answer ? "border-[#6fb98f] bg-[#183225] text-[#c6ded2]" : "border-[#e34a3f] bg-[#21191a] text-[#f0c2bd]" : "border-[#3f4652] bg-[#101b2b]/70 text-[#c3c7ce] hover:border-[#e5b85c]"}`}><JapaneseText text={option} vocabulary={module.vocabulary} kanji={module.kanji} always inspect={false} /></button>)}</div> : null}
      <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" onClick={() => setRevealed((value) => !value)} className="rounded-lg bg-[#e5b85c] px-4 py-2.5 text-sm font-semibold text-[#0b0b0d]">{revealed ? "Hide model" : "Reveal model"}</button>{activity.kind !== "pragmatics" && activity.kind !== "chunks" ? <AudioControls text={activity.model} reading={activity.reading} humanFirst /> : null}{choice !== null && activity.answer !== undefined ? <span className={`text-xs ${choiceCorrect ? "text-[#8bcca6]" : "text-[#ef675d]"}`}>{choiceCorrect ? "Good choice." : "Try the phrase in context again."}</span> : null}</div>
      {revealed ? <div className="mt-4 rounded-lg border border-[#315d4b] bg-[#162b26]/70 p-4" aria-live="polite"><p className="eyebrow text-[#8bcca6]">Model / useful phrase</p><p className="mt-2 whitespace-pre-line jp-serif text-lg text-[#f5f5f2]"><JapaneseText text={activity.model} vocabulary={module.vocabulary} kanji={module.kanji} always inspect={false} /></p>{activity.kind === "writing" ? <p className="mt-2 text-xs text-[#9297a1]">Compare structure and target forms; this is not automatically graded.</p> : null}</div> : null}
    </div>
  </section>;
}
