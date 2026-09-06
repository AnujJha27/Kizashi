"use client";

import { useEffect, useMemo, useState, type PointerEvent } from "react";

import { type ExternalSourceLink } from "@/components/learning/external-source-launcher";
import { ExternalSourceViewer } from "@/components/learning/external-source-viewer";
import { ContentReviewControls } from "@/components/library/content-flag-button";
import kanjiStrokeData from "@/data/kanjivg-strokes.json";
import { advanceWritingState, evaluateStrokeOrder, getComponentQuizOptions, getJishoKanjiUrl, getStrokeQuizOptions, getStrokeStartPoint, getTanoshiiKanjiUrl, normalizeStrokeData } from "@/lib/kanji-writing-core.js";
import { readKanjiWritingProgress, writeKanjiWritingProgress, type KanjiWritingState } from "@/lib/session";
import type { KanjiItem } from "@/lib/types";

type Point = { x: number; y: number };
type Mode = "watch" | "trace" | "write";
type StrokeData = { character: string; strokes: Array<{ order: number; path: string }>; componentGroups?: Array<{ element: string; strokeOrders: number[]; position?: string; radical?: string; original?: string }> };
type StrokeQuizOption = { order: number; path: string; correct: boolean };
type ComponentQuizOption = { element: string; position: string; correct: boolean };

function pointFor(event: PointerEvent<SVGSVGElement>): Point {
  const box = event.currentTarget.getBoundingClientRect();
  return { x: ((event.clientX - box.left) / box.width) * 109, y: ((event.clientY - box.top) / box.height) * 109 };
}

const componentPalette = ["#e5b85c", "#6fb98f", "#a6c9dc", "#ef675d"];
function componentColor(index: number) {
  return componentPalette[index % componentPalette.length];
}

export function KanjiWritingTrainer({ item }: Readonly<{ item: KanjiItem }>) {
  const strokeData = useMemo<StrokeData | null>(() => normalizeStrokeData((kanjiStrokeData.characters as Record<string, unknown>)[item.character], item.character) as StrokeData | null, [item.character]);
  const [mode, setMode] = useState<Mode>("watch");
  const [activeStroke, setActiveStroke] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showNumbers, setShowNumbers] = useState(true);
  const [showComponents, setShowComponents] = useState(false);
  const [drawnStrokes, setDrawnStrokes] = useState<Point[][]>([]);
  const [drawing, setDrawing] = useState<Point[]>([]);
  const [activePointerId, setActivePointerId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [quizStroke, setQuizStroke] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState("");
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [componentQuizOpen, setComponentQuizOpen] = useState(false);
  const [componentQuizFeedback, setComponentQuizFeedback] = useState("");
  const [componentQuizAnswered, setComponentQuizAnswered] = useState(false);
  const [writingState, setWritingState] = useState<KanjiWritingState>(() => readKanjiWritingProgress()[item.id]?.state ?? "not-introduced");
  const jishoSource = useMemo<ExternalSourceLink>(() => ({ id: `jisho-kanji-${item.character}`, sourceId: "jisho", name: "Jisho.org", title: `Jisho reference · ${item.character}`, resourceTypes: ["dictionary reference"], mediaDelivery: "frame-or-link", description: `External dictionary reference for ${item.character}.`, url: getJishoKanjiUrl(item.character) ?? "https://jisho.org/", license: "Provider-hosted; see Jisho terms", attribution: "Jisho.org" }), [item.character]);
  const tanoshiiUrl = getTanoshiiKanjiUrl(item.character);

  useEffect(() => {
    if (!playing || !strokeData) return;
    const timer = window.setInterval(() => setActiveStroke((value) => {
      if (value >= strokeData.strokes.length - 1) {
        setPlaying(false);
        return value;
      }
      return value + 1;
    }), 850);
    return () => window.clearInterval(timer);
  }, [playing, strokeData]);

  const resetWatch = () => { setPlaying(false); setActiveStroke(0); };
  const clearDrawing = () => { setDrawnStrokes([]); setDrawing([]); setFeedback(""); };
  const recordWriting = (next: KanjiWritingState) => { const state = advanceWritingState(writingState, next) as KanjiWritingState; setWritingState(state); writeKanjiWritingProgress(item.id, state); };
  const quizOptions = useMemo<StrokeQuizOption[]>(() => quizStroke === null || !strokeData ? [] : getStrokeQuizOptions(strokeData.strokes, quizStroke), [quizStroke, strokeData]);
  const componentQuizOptions = useMemo<ComponentQuizOption[]>(() => getComponentQuizOptions(strokeData?.componentGroups), [strokeData]);
  const startQuiz = () => { setPlaying(false); setQuizStroke(0); setQuizFeedback(""); setQuizAnswered(false); };
  const answerQuiz = (option: StrokeQuizOption) => { if (quizAnswered) return; setQuizAnswered(true); setQuizFeedback(option.correct ? "Good — that is the next stroke." : `Not quite — stroke ${quizStroke === null ? 1 : quizStroke + 1} comes next.`); };
  const advanceQuiz = () => { if (quizStroke === null || !strokeData) return; if (quizStroke >= strokeData.strokes.length - 1) { setQuizStroke(null); setQuizFeedback("Quiz complete — now try writing it."); return; } setQuizStroke((value) => (value === null ? 0 : value + 1)); setQuizFeedback(""); setQuizAnswered(false); };
  const startComponentQuiz = () => { setComponentQuizOpen(true); setComponentQuizFeedback(""); setComponentQuizAnswered(false); };
  const answerComponentQuiz = (option: ComponentQuizOption) => { if (componentQuizAnswered) return; setComponentQuizAnswered(true); setComponentQuizFeedback(option.correct ? "Good — that component sits on the left." : "Not quite — look for the component marked left in the structure line above."); };
  const beginDrawing = (event: PointerEvent<SVGSVGElement>) => { if (mode === "watch") return; event.currentTarget.setPointerCapture(event.pointerId); setActivePointerId(event.pointerId); setDrawing([pointFor(event)]); };
  const continueDrawing = (event: PointerEvent<SVGSVGElement>) => { if (event.pointerId !== activePointerId) return; setDrawing((points) => [...points, pointFor(event)]); };
  const finishDrawing = (event: PointerEvent<SVGSVGElement>) => {
    if (event.pointerId !== activePointerId || !drawing.length) return;
    const nextStroke = drawnStrokes.length + 1;
    setDrawnStrokes((strokes) => [...strokes, drawing]);
    setDrawing([]);
    setActivePointerId(null);
    recordWriting(mode === "write" ? "written-from-memory" : "traced");
    if (strokeData) setFeedback(evaluateStrokeOrder(Math.min(nextStroke, strokeData.strokes.length), nextStroke).message);
  };
  const cancelDrawing = (event: PointerEvent<SVGSVGElement>) => {
    if (event.pointerId !== activePointerId) return;
    setDrawing([]);
    setActivePointerId(null);
  };

  if (!strokeData) return <section className="mt-8 rounded-xl border border-[#5d4c2c] bg-[#211d18]/60 p-5" aria-labelledby="kanji-writing-title"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">漢字を書く · Writing</p><h2 id="kanji-writing-title" className="mt-1 text-xl font-medium">Stroke-order practice is not cached for this character yet.</h2><p className="mt-2 text-sm leading-6 text-[#c3c7ce]">Kizashi will show the native watch, trace, and write trainer when its KanjiVG record is available. These references remain optional.</p><ContentReviewControls itemId={item.id} category="kanji" reviewStatus={item.reviewStatus} tags={item.tags} origin="kanji-writing" editValue={item.meanings.join(" · ")} /></div><span className="rounded-full border border-[#5d4c2c] px-3 py-1 text-xs text-[#e5b85c]">Data unavailable · {writingState}</span></div><div className="mt-4 flex flex-wrap gap-2"><ExternalSourceViewer source={jishoSource} /><a href={tanoshiiUrl ?? "https://www.tanoshiijapanese.com/"} target="_blank" rel="noreferrer" className="inline-flex rounded-lg border border-[#3f4652] px-3 py-2 text-xs font-semibold text-[#c3c7ce] hover:border-[#e5b85c]">View alternate stroke reference ↗</a></div></section>;

  return <section className="mt-8 rounded-xl border border-[#3f3427] bg-[#151720]/80 p-5 sm:p-6" aria-labelledby="kanji-writing-title">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">漢字を書く · Writing</p><h2 id="kanji-writing-title" className="mt-1 text-xl font-medium">See it, trace it, then write it.</h2><p className="mt-2 text-sm text-[#9297a1]">{strokeData.strokes.length} strokes · writing familiarity: {writingState} · separate from JLPT mastery.</p>{strokeData.componentGroups?.length ? <p className="mt-2 text-xs text-[#9297a1]">Structure: {componentQuizOpen ? strokeData.componentGroups.map((group) => group.element).join(" · ") : strokeData.componentGroups.map((group) => `${group.element}${group.position ? ` · ${group.position}` : ""}${group.radical ? " · radical" : ""}`).join(" · ")}</p> : null}<ContentReviewControls itemId={item.id} category="kanji" reviewStatus={item.reviewStatus} tags={item.tags} origin="kanji-writing" editValue={item.meanings.join(" · ")} /></div><span className="rounded-full border border-[#3f4652] px-3 py-1 text-xs text-[#e5b85c]">KanjiVG</span></div>
    <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Kanji writing mode">{(["watch", "trace", "write"] as Mode[]).map((value) => <button key={value} type="button" role="tab" aria-selected={mode === value} onClick={() => { setMode(value); setPlaying(false); setFeedback(""); }} className={`rounded-lg px-3 py-2 text-xs capitalize ${mode === value ? "bg-[#e5b85c] text-[#0b0b0d]" : "border border-[#3f4652] text-[#c3c7ce] hover:border-[#e5b85c]"}`}>{value === "write" ? "Write from memory" : value}</button>)}{strokeData.componentGroups?.length ? <button type="button" onClick={() => setShowComponents((value) => !value)} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#e5b85c]">{showComponents ? "Hide components" : "Show components"}</button> : null}<button type="button" onClick={startQuiz} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#e5b85c]">Next-stroke quiz</button>{componentQuizOptions.length ? <button type="button" onClick={startComponentQuiz} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#e5b85c]">Component check</button> : null}</div>
    <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_15rem] md:items-start"><div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-xl border border-[#5d4c2c] bg-[#211d18]" style={{ touchAction: mode === "watch" ? "auto" : "none" }}><svg viewBox="0 0 109 109" className="h-full w-full select-none" role="img" aria-label={`${item.character} stroke practice`} onPointerDown={beginDrawing} onPointerMove={continueDrawing} onPointerUp={finishDrawing} onPointerCancel={cancelDrawing}><path d="M54.5 0V109M0 54.5H109M15 15L94 94M94 15L15 94" className="fill-none stroke-[#e5b85c]/10" strokeWidth=".5" />{mode !== "write" ? strokeData.strokes.map((stroke, index) => { const groupIndex = showComponents ? strokeData.componentGroups?.findIndex((group) => group.strokeOrders.includes(stroke.order)) ?? -1 : -1; return <path key={stroke.order} d={stroke.path} className={`kanji-stroke ${index === activeStroke ? "kanji-stroke-current" : ""}`} fill={index === activeStroke ? "#e34a3f" : groupIndex >= 0 ? componentColor(groupIndex) : "#f5f5f2"} opacity={index <= activeStroke ? 0.9 : 0.12} />; }) : null}{showNumbers && mode === "watch" ? strokeData.strokes.map((stroke) => { const point = getStrokeStartPoint(stroke.path); return point ? <g key={`number-${stroke.order}`} aria-label={`Stroke ${stroke.order}`}><circle cx={point.x} cy={point.y} r="3.2" fill="#211d18" stroke="#e5b85c" strokeWidth=".5" /><text x={point.x} y={point.y + 1.4} textAnchor="middle" fill="#e5b85c" fontSize="3.2" fontWeight="600">{stroke.order}</text></g> : null; }) : null}{drawnStrokes.map((points, index) => <polyline key={`drawn-${index}`} points={points.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke="#e5b85c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />)}{drawing.length ? <polyline points={drawing.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke="#ef675d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /> : null}</svg></div><div className="space-y-3"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { recordWriting("watched"); setPlaying(true); setActiveStroke(0); }} className="rounded-lg bg-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#0b0b0d]">Play</button><button type="button" onClick={resetWatch} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce]">Restart</button></div>{mode === "watch" ? <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setActiveStroke((value) => Math.max(0, value - 1))} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce]">Previous stroke</button><button type="button" onClick={() => setActiveStroke((value) => Math.min(strokeData.strokes.length - 1, value + 1))} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce]">Next stroke</button></div> : <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setDrawnStrokes((strokes) => strokes.slice(0, -1))} disabled={!drawnStrokes.length} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] disabled:opacity-40">Undo</button><button type="button" onClick={clearDrawing} className="rounded-lg border border-[#5d3936] px-3 py-2 text-xs text-[#e5b85c]">Clear</button>{mode === "write" ? <button type="button" onClick={() => setMode("trace")} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce]">Reveal</button> : null}</div>}<button type="button" onClick={() => setShowNumbers((value) => !value)} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce]">{showNumbers ? "Hide numbers" : "Show numbers"}</button><p className="text-xs leading-5 text-[#9297a1]" role="status">{feedback || (mode === "watch" ? `Stroke ${activeStroke + 1} of ${strokeData.strokes.length}` : "Draw with mouse, finger, or stylus.")}</p></div></div>
    {quizStroke !== null ? <div className="mt-5 rounded-xl border border-[#4b3a29] bg-[#211d18]/70 p-4" aria-labelledby="next-stroke-quiz-title"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">Recognition · 読む</p><h3 id="next-stroke-quiz-title" className="mt-1 text-lg font-medium">What comes next?</h3><p className="mt-1 text-xs text-[#9297a1]">Choose stroke {quizStroke + 1} of {strokeData.strokes.length}. This quiz does not change writing familiarity.</p></div><button type="button" onClick={() => { setQuizStroke(null); setQuizFeedback(""); }} className="text-xs text-[#9297a1] underline underline-offset-4 hover:text-[#e5b85c]">Close quiz</button></div><div className="mt-4 grid gap-4 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center"><div className="mx-auto aspect-square w-28 rounded-lg border border-[#3f4652] bg-[#151720] p-2"><svg viewBox="0 0 109 109" className="h-full w-full" role="img" aria-label={`${item.character} partial stroke preview`}><path d="M54.5 0V109M0 54.5H109M15 15L94 94M94 15L15 94" className="fill-none stroke-[#e5b85c]/10" strokeWidth=".5" />{strokeData.strokes.slice(0, quizStroke).map((stroke) => <path key={`quiz-complete-${stroke.order}`} d={stroke.path} fill="#f5f5f2" opacity=".9" />)}</svg></div><div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{quizOptions.map((option) => <button key={`quiz-option-${option.order}`} type="button" disabled={quizAnswered} onClick={() => answerQuiz(option)} aria-label={`Choose stroke ${option.order}`} className={`rounded-lg border p-2 text-center transition-colors ${quizAnswered && option.correct ? "border-[#6fb98f] bg-[#183225]" : "border-[#3f4652] bg-[#151720] hover:border-[#e5b85c]"}`}><svg viewBox="0 0 109 109" className="mx-auto aspect-square w-full" aria-hidden="true"><path d={option.path} fill={quizAnswered && option.correct ? "#8bcca6" : "#f5f5f2"} opacity=".9" /></svg><span className="mt-1 block text-[11px] text-[#9297a1]">Stroke {option.order}</span></button>)}</div><p className="mt-3 text-xs leading-5 text-[#c3c7ce]" role="status">{quizFeedback || "Tap a candidate stroke to answer."}</p>{quizAnswered ? <button type="button" onClick={advanceQuiz} className="mt-3 rounded-lg bg-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#0b0b0d]">{quizStroke >= strokeData.strokes.length - 1 ? "Finish quiz" : "Next stroke"}</button> : null}</div></div></div> : null}
    {componentQuizOpen && componentQuizOptions.length ? <div className="mt-5 rounded-xl border border-[#4b3a29] bg-[#211d18]/70 p-4" aria-labelledby="component-quiz-title"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">Structure · 構成</p><h3 id="component-quiz-title" className="mt-1 text-lg font-medium">Which component is on the left?</h3><p className="mt-1 text-xs text-[#9297a1]">An optional structure check from the imported KanjiVG groups.</p></div><button type="button" onClick={() => setComponentQuizOpen(false)} className="text-xs text-[#9297a1] underline underline-offset-4 hover:text-[#e5b85c]">Close check</button></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{componentQuizOptions.map((option) => <button key={`component-option-${option.element}`} type="button" disabled={componentQuizAnswered} onClick={() => answerComponentQuiz(option)} className={`rounded-lg border px-3 py-3 text-center transition-colors ${componentQuizAnswered && option.correct ? "border-[#6fb98f] bg-[#183225]" : "border-[#3f4652] bg-[#151720] hover:border-[#e5b85c]"}`}><span className="jp-serif text-2xl text-[#f5f5f2]">{option.element}</span><span className="mt-1 block text-[11px] text-[#9297a1]">component</span></button>)}</div><p className="mt-3 text-xs leading-5 text-[#c3c7ce]" role="status">{componentQuizFeedback || "Tap a component to answer."}</p></div> : null}
    <div className="mt-5 border-t border-white/10 pt-4"><p className="text-xs text-[#9297a1]">Source: KanjiVG · CC BY-SA 3.0 · writing familiarity does not change JLPT readiness.</p><div className="mt-3 flex flex-wrap gap-2"><ExternalSourceViewer source={jishoSource} /><a href={tanoshiiUrl ?? "https://www.tanoshiijapanese.com/"} target="_blank" rel="noreferrer" className="inline-flex rounded-lg border border-[#3f4652] px-3 py-2 text-xs font-semibold text-[#c3c7ce] hover:border-[#e5b85c]">Alternate stroke reference ↗</a></div></div>
  </section>;
}
