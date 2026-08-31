"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type TouchEvent } from "react";

import { JapaneseText } from "@/components/learning/japanese-text";
import { AudioControls } from "@/components/learning/audio-controls";
import { clearPracticeSession, readAnswerLeniency, readAutoPlayAudio, readPracticeSession, recordExamAttempt, recordQuestionAmbiguity, recordQuestionAnswer, recordReview, recordStudyActivity, writePracticeSession, type AnswerLeniency, type MasterySignal, type ReviewRating } from "@/lib/session";
import { normalizeAnswer, reviewRatingForConfidence } from "@/lib/mastery";
import type { AnswerConfidence, KanjiItem, PracticeQuestion, VocabularyItem } from "@/lib/types";

type CompletionResult = { correct: number; total: number; categoryBreakdown: Record<string, { correct: number; total: number }> };
type SessionSignal = { confidence: AnswerConfidence | null; responseMs: number | null };
type CompletionFilter = "all" | "wrong" | "uncertain" | "slow";

function completionResult(questions: PracticeQuestion[], answers: Record<string, boolean>): CompletionResult {
  const categoryBreakdown = questions.reduce<Record<string, { correct: number; total: number }>>((result, entry) => {
    const answer = answers[entry.id];
    if (typeof answer === "boolean") {
      result[entry.category] ??= { correct: 0, total: 0 };
      result[entry.category].total += 1;
      result[entry.category].correct += answer ? 1 : 0;
    }
    return result;
  }, {});
  return { correct: Object.values(answers).filter(Boolean).length, total: questions.length, categoryBreakdown };
}

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function saveExamAttempt(sessionId: string, questions: PracticeQuestion[], answers: Record<string, boolean>, startedAt: number | null) {
  if (startedAt === null) return;
  const result = completionResult(questions, answers);
  const section = sessionId === "diagnostic" ? "diagnostic" : sessionId === "mini-test" ? "mini" : sessionId === "section-test" ? "section" : sessionId === "full-test" ? "full" : "sampler";
  recordExamAttempt({ attemptId: `${sessionId}-${Date.now()}`, level: "N5", section, questionsAttempted: Object.keys(answers).length, correct: result.correct, duration: Math.round((Date.now() - startedAt) / 1000), categoryBreakdown: result.categoryBreakdown, weakTopics: Object.entries(result.categoryBreakdown).filter(([, score]) => score.correct / Math.max(score.total, 1) < 0.75).map(([category]) => category), completedAt: Date.now() });
}

function masterySignal(question: PracticeQuestion): MasterySignal {
  if (question.category === "reading" || question.category === "listening") return "context";
  return ["meaning", "audio recognition", "kanji reading", "kanji meaning"].includes(question.questionType) ? "recognition" : "recall";
}

function stageLabel(question: PracticeQuestion) {
  if (question.category === "reading" || question.category === "listening") return "Stage 5 · natural context";
  if (["contextual vocabulary", "sentence completion", "grammar in context", "reading in context", "text grammar", "sentence ordering"].includes(question.questionType)) return "Stage 4 · sentence context";
  if (["kana recall", "Japanese recall", "word to kanji recall"].includes(question.questionType)) return "Stage 3 · active recall";
  return "Stage 1 · recognition";
}

const confidenceOptions: Array<[AnswerConfidence, string]> = [["guess", "Guess"], ["unsure", "Unsure"], ["confident", "Confident"]];

function answerText(question: PracticeQuestion) {
  if (question.answerMode === "text") return question.acceptedAnswers?.join(" / ") || "Not set";
  if (question.questionType === "sentence ordering" && question.tokens && question.correctOrder) return question.correctOrder.map((index) => question.tokens?.[index]).join(" ");
  return question.options[question.correctIndex] ?? "Not set";
}

function CompletionReview({ questions, answers, signals, filter, onFilter, vocabulary, kanji, examMode }: Readonly<{ questions: PracticeQuestion[]; answers: Record<string, boolean>; signals: Record<string, SessionSignal>; filter: CompletionFilter; onFilter: (filter: CompletionFilter) => void; vocabulary: VocabularyItem[]; kanji: KanjiItem[]; examMode: boolean }>) {
  const matches = (question: PracticeQuestion, selectedFilter: CompletionFilter) => selectedFilter === "all" || (selectedFilter === "wrong" && answers[question.id] === false) || (selectedFilter === "uncertain" && ["guess", "unsure"].includes(signals[question.id]?.confidence ?? "")) || (selectedFilter === "slow" && (signals[question.id]?.responseMs ?? 0) >= 12000);
  const counts: Record<CompletionFilter, number> = { all: questions.length, wrong: questions.filter((question) => matches(question, "wrong")).length, uncertain: questions.filter((question) => matches(question, "uncertain")).length, slow: questions.filter((question) => matches(question, "slow")).length };
  const visible = questions.filter((question) => matches(question, filter));
  const labels: Record<CompletionFilter, string> = { all: "All", wrong: "Wrong", uncertain: "Uncertain", slow: "Slow" };
  return <section className="mx-auto mt-7 max-w-2xl border-t border-white/10 pt-6 text-left"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow mb-2">Question review · 見直し</p><h3 className="text-lg font-medium text-[#f5f5f2]">Turn the signals into another pass.</h3></div><p className="text-xs text-[#9297a1]">Wrong, uncertain, and slow answers stay visible.</p></div><div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter question review">{(Object.keys(labels) as CompletionFilter[]).map((value) => <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => onFilter(value)} className={`rounded-lg border px-3 py-2 text-xs ${filter === value ? "border-[#e5b85c] bg-[#302818] text-[#f1cf7c]" : "border-[#3f4652] text-[#9297a1] hover:border-[#e5b85c]"}`}>{labels[value]} · {counts[value]}</button>)}</div>{visible.length ? <div className="mt-4 space-y-2">{visible.map((question) => { const signal = signals[question.id]; const tags = [answers[question.id] === false ? "wrong" : "correct", signal?.confidence === "guess" || signal?.confidence === "unsure" ? signal.confidence : "", (signal?.responseMs ?? 0) >= 12000 ? "slow" : ""].filter(Boolean); return <article key={question.id} className="rounded-xl border border-white/10 bg-[#101b2b]/70 p-4"><div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[.12em]">{tags.map((tag) => <span key={tag} className={tag === "wrong" ? "text-[#ef675d]" : tag === "correct" ? "text-[#6fb98f]" : "text-[#8cc9e5]"}>{tag}</span>)}<span className="text-[#e5b85c]">{question.category}</span><span className="text-[#676c75]">{question.questionType}</span></div><p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#f5f5f2]"><LearningText text={question.prompt} vocabulary={vocabulary} kanji={kanji} examMode={examMode} /></p><p className="mt-3 text-xs text-[#e5b85c]">Answer: {answerText(question)}</p><div className="mt-3 flex items-start justify-between gap-3"><p className="text-xs leading-5 text-[#9297a1]">{question.explanation}</p><Link href={`/entry/${question.itemId}`} className="shrink-0 text-xs font-semibold text-[#e5b85c] hover:text-[#f1cf7c]">Entry →</Link></div></article>; })}</div> : <p className="mt-4 rounded-xl border border-[#315d4b] bg-[#162b26]/70 p-4 text-sm text-[#c6ded2]">Nothing in this group. Keep the clean answers warm.</p>}</section>;
}

function LearningText({ text, vocabulary, kanji, examMode }: Readonly<{ text: string; vocabulary: VocabularyItem[]; kanji: KanjiItem[]; examMode: boolean }>) {
  return examMode ? <>{text}</> : <JapaneseText text={text} vocabulary={vocabulary} kanji={kanji} />;
}

export function PracticePlayer({ questions, vocabulary = [], kanji = [], examMode = false, examLabel = "N5 sampler", onComplete, sessionId, timeLimitSeconds }: Readonly<{ questions: PracticeQuestion[]; vocabulary?: VocabularyItem[]; kanji?: KanjiItem[]; examMode?: boolean; examLabel?: string; onComplete?: (result: CompletionResult) => void; sessionId?: string; timeLimitSeconds?: number }>) {
  const activeSessionId = sessionId ?? (examMode ? "diagnostic" : "practice");
  const questionIds = questions.map((question) => question.id);
  const questionKey = questionIds.join("|");
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [order, setOrder] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [complete, setComplete] = useState(false);
  const [answerResults, setAnswerResults] = useState<Record<string, boolean>>({});
  const [sessionSignals, setSessionSignals] = useState<Record<string, SessionSignal>>({});
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>("wrong");
  const [reported, setReported] = useState(false);
  const [confidence, setConfidence] = useState<AnswerConfidence | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [sessionStartedAt, setSessionStartedAt] = useState(0);
  const [examStartedAt, setExamStartedAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);
  const [answerLeniency, setAnswerLeniency] = useState<AnswerLeniency>("kana");
  const [ready, setReady] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const saved = readPracticeSession(activeSessionId, questionIds);
    setComplete(false);
    setReported(false);
    setSessionSignals({});
    setCompletionFilter("wrong");
    if (saved) {
      setPosition(Math.min(saved.position, Math.max(questionIds.length - 1, 0)));
      setSelected(saved.selected);
      setTypedAnswer(saved.typedAnswer ?? "");
      setOrder(saved.order ?? []);
      setSubmitted(saved.submitted);
      setScore(saved.score);
      setAnswerResults(saved.answerResults);
      setConfidence(saved.confidence);
    } else {
      setPosition(0);
      setSelected(null);
      setTypedAnswer("");
      setOrder([]);
      setSubmitted(false);
      setScore(0);
    setAnswerResults({});
    setConfidence(null);
    }
    const nextSessionStartedAt = saved?.startedAt ?? Date.now();
    setStartedAt(Date.now());
    setSessionStartedAt(nextSessionStartedAt);
    setExamStartedAt(timeLimitSeconds ? nextSessionStartedAt : null);
    setRemainingSeconds(timeLimitSeconds ? Math.max(0, timeLimitSeconds - Math.floor((Date.now() - nextSessionStartedAt) / 1000)) : null);
    setReady(true);
    // ponytail: the question key is the session identity; do not restore another drill.
  }, [activeSessionId, questionKey, timeLimitSeconds]);

  useEffect(() => { setAutoPlayAudio(readAutoPlayAudio()); setAnswerLeniency(readAnswerLeniency()); }, []);

  useEffect(() => {
    if (!ready || !questions.length || complete) return;
    writePracticeSession({ sessionId: activeSessionId, questionIds, startedAt: sessionStartedAt || undefined, position, selected, typedAnswer, order, submitted, score, answerResults, confidence });
  }, [activeSessionId, answerResults, complete, confidence, order, position, questionKey, ready, score, selected, sessionStartedAt, submitted, typedAnswer]);

  useEffect(() => {
    if (!ready || !timeLimitSeconds || examStartedAt === null || complete) return;
    const finishOnTime = () => {
      const result = completionResult(questions, answerResults);
      setScore(result.correct);
      setEarnedXp(0);
      recordStudyActivity(0, Math.max(1, Math.ceil((Date.now() - sessionStartedAt) / 60000)));
      saveExamAttempt(activeSessionId, questions, answerResults, examStartedAt);
      onComplete?.(result);
      clearPracticeSession(activeSessionId);
      setComplete(true);
    };
    const tick = () => {
      const remaining = Math.max(0, timeLimitSeconds - Math.floor((Date.now() - examStartedAt) / 1000));
      setRemainingSeconds(remaining);
      if (remaining === 0) finishOnTime();
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [activeSessionId, answerResults, complete, examStartedAt, onComplete, questions, ready, timeLimitSeconds]);

  useEffect(() => {
    if (!ready || complete) return;
    const upcoming = questions[position + 1];
    if (!upcoming?.audioUrl) return;
    const audio = new Audio(upcoming.audioUrl);
    audio.preload = "auto";
    return () => { audio.src = ""; };
  }, [complete, position, questionKey, questions, ready]);

  if (!ready) return <div className="min-h-80 animate-pulse rounded-xl bg-[#17181d]" aria-label="Loading practice session" />;
  if (!questions.length) return <div className="rounded-xl border border-[#713b37] bg-[#21191a] p-5 text-sm text-[#f5f5f2]">No questions are ready for this practice mode yet.</div>;

  if (complete) {
    const result = completionResult(questions, answerResults);
    const diagnosticPriority = Object.entries(result.categoryBreakdown).sort((left, right) => left[1].correct / Math.max(left[1].total, 1) - right[1].correct / Math.max(right[1].total, 1))[0];
    const wrong = questions.filter((question) => answerResults[question.id] === false).length;
    const uncertain = questions.filter((question) => sessionSignals[question.id]?.confidence === "guess" || sessionSignals[question.id]?.confidence === "unsure").length;
    const slow = questions.filter((question) => (sessionSignals[question.id]?.responseMs ?? 0) >= 12000).length;
    const sessionMinutes = Math.max(1, Math.ceil((Date.now() - sessionStartedAt) / 60000));
    return <div className="min-h-80 rounded-xl border border-[#3f3427] bg-[#211d18] p-8 text-center"><p className="jp-serif text-4xl text-[#e5b85c]">{examMode ? "テスト終了" : "練習おわり"}</p><p className="mt-2 text-xs uppercase tracking-[.16em] text-[#9297a1]">{examMode ? examLabel : "Practice complete"}</p><p className="mt-3 text-sm text-[#9297a1]">You got {score} of {questions.length} questions right · {sessionMinutes} min</p>{earnedXp ? <p className="mt-3 text-sm font-semibold text-[#e5b85c]">+{earnedXp} XP · session complete</p> : null}{activeSessionId === "diagnostic" && diagnosticPriority ? <div className="mx-auto mt-6 max-w-lg rounded-xl border border-[#5d4c2c] bg-[#2b2418]/70 p-4 text-left"><p className="eyebrow">Recommended next · 次の道</p><p className="mt-2 text-sm text-[#f5f5f2]">Strengthen {diagnosticPriority[0]} first: {diagnosticPriority[1].correct} / {diagnosticPriority[1].total} correct.</p><Link href={`/practice?mode=${diagnosticPriority[0]}`} className="mt-3 inline-flex text-sm font-semibold text-[#e5b85c] hover:text-[#f1cf7c]">Open {diagnosticPriority[0]} practice →</Link></div> : null}<div className="mx-auto mt-7 grid max-w-lg grid-cols-3 gap-2 text-left"><div className="rounded-lg bg-[#21191a] p-3"><p className="text-xs text-[#9297a1]">Wrong</p><p className="mt-1 text-xl font-semibold text-[#ef675d]">{wrong}</p></div><div className="rounded-lg bg-[#2b2418] p-3"><p className="text-xs text-[#9297a1]">Uncertain</p><p className="mt-1 text-xl font-semibold text-[#e5b85c]">{uncertain}</p></div><div className="rounded-lg bg-[#102536] p-3"><p className="text-xs text-[#9297a1]">Slow</p><p className="mt-1 text-xl font-semibold text-[#8cc9e5]">{slow}</p></div></div><CompletionReview questions={questions} answers={answerResults} signals={sessionSignals} filter={completionFilter} onFilter={setCompletionFilter} vocabulary={vocabulary} kanji={kanji} examMode={examMode} /><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/practice?mode=weak" className="rounded-xl bg-[#e34a3f] px-4 py-3 text-sm font-semibold text-[#0b0b0d] hover:bg-[#ef675d]">Review weak areas</Link><Link href="/review" className="rounded-xl border border-[#5d3936] px-4 py-3 text-sm font-semibold text-[#f5f5f2] hover:border-[#e34a3f]">Open review</Link><button type="button" onClick={() => { clearPracticeSession(activeSessionId); const freshStart = Date.now(); setPosition(0); setSelected(null); setTypedAnswer(""); setOrder([]); setSubmitted(false); setScore(0); setEarnedXp(0); setAnswerResults({}); setSessionSignals({}); setCompletionFilter("wrong"); setConfidence(null); setReported(false); setStartedAt(freshStart); setSessionStartedAt(freshStart); setExamStartedAt(timeLimitSeconds ? freshStart : null); setRemainingSeconds(timeLimitSeconds ?? null); setComplete(false); }} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-[#9297a1] hover:text-[#f5f5f2]">Start again</button></div></div>;
  }

  const question = questions[position];
  const isOrdering = question.questionType === "sentence ordering" && Boolean(question.tokens?.length);
  const isTextAnswer = question.answerMode === "text";
  const showPromptFurigana = !["kanji reading", "kana recall"].includes(question.questionType);
  const tokens = question.tokens ?? [];
  const orderComplete = !isOrdering || order.length === tokens.length;
  const isCorrect = isOrdering ? orderComplete && order.every((token, index) => token === question.correctOrder?.[index]) : isTextAnswer ? (question.acceptedAnswers ?? []).some((answer) => normalizeAnswer(answer, answerLeniency) === normalizeAnswer(typedAnswer, answerLeniency)) : selected === question.correctIndex;
  const hasAnswer = isOrdering ? orderComplete : isTextAnswer ? Boolean(typedAnswer.trim()) : selected !== null;
  const showFeedback = submitted && !examMode;
  const suggestedRating: ReviewRating = reviewRatingForConfidence(isCorrect, confidence);

  const submit = () => {
    if (!hasAnswer || submitted) return;
    const responseMs = startedAt ? Date.now() - startedAt : null;
    recordQuestionAnswer(question.id, isCorrect, responseMs, confidence);
    setSessionSignals((value) => ({ ...value, [question.id]: { confidence, responseMs } }));
    if (isCorrect) setScore((value) => value + 1);
    setAnswerResults((value) => ({ ...value, [question.id]: isCorrect }));
    setSubmitted(true);
  };

  const next = (rating = suggestedRating) => {
    if (!submitted) return;
    if (!examMode) recordReview(question.itemId, rating, masterySignal(question), question.questionType, 0);
    if (position === questions.length - 1) {
      const finalAnswers = { ...answerResults, [question.id]: isCorrect };
      const result = completionResult(questions, finalAnswers);
      const sessionXp = examMode ? 0 : 5 + questions.reduce((total, entry) => total + (entry.category === "reading" ? 4 : entry.category === "grammar" ? 2 : 0), 0);
      const sessionMinutes = Math.max(1, Math.ceil((Date.now() - sessionStartedAt) / 60000));
      setScore(result.correct);
      recordStudyActivity(sessionXp, sessionMinutes);
      setEarnedXp(sessionXp);
      if (examMode) saveExamAttempt(activeSessionId, questions, finalAnswers, examStartedAt);
      onComplete?.(result);
      clearPracticeSession(activeSessionId);
      setComplete(true);
      return;
    }
    setPosition((value) => value + 1);
    setSelected(null);
    setTypedAnswer("");
    setOrder([]);
    setSubmitted(false);
    setConfidence(null);
    setReported(false);
    setStartedAt(Date.now());
  };

  const handleTouchStart = (event: TouchEvent) => {
    if (!submitted || examMode) return;
    const touch = event.changedTouches[0];
    if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || !submitted || examMode) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const horizontal = Math.abs(deltaX) > Math.abs(deltaY);
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 56) return;
    const rating: ReviewRating = horizontal ? deltaX < 0 ? "again" : "easy" : deltaY < 0 ? "good" : "hard";
    next(rating);
  };

  return <div>
    <div className="mb-5 flex items-center justify-between text-xs text-[#9297a1]"><span>{examMode ? `${examLabel} · exam mode` : <>{`${question.category} · ${question.questionType}`}<span className="ml-2 text-[#e5b85c]">{stageLabel(question)}</span></>}</span><span className="flex items-center gap-3">{remainingSeconds !== null ? <span className={remainingSeconds <= 60 ? "font-semibold text-[#ef675d]" : "text-[#e5b85c]"}>Time {formatTime(remainingSeconds)}</span> : null}<span>{position + 1} / {questions.length}</span></span></div>
    <div className="mb-7 h-1 overflow-hidden rounded-full bg-[#292b31]"><div className="h-full rounded-full bg-[#e34a3f] transition-[width] duration-300" style={{ width: `${((position + (submitted ? 1 : 0)) / questions.length) * 100}%` }} /></div>
    <div className="rounded-xl border border-[#3f3427] bg-[#151720]/80 p-7 sm:p-10" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <p className="eyebrow mb-5">{examMode ? isTextAnswer ? "Type the answer" : "Select one answer" : isOrdering ? "Build the sentence" : isTextAnswer ? "Recall the answer" : "Choose the best answer"}</p>
      <h2 className="jp-serif whitespace-pre-line text-2xl leading-relaxed text-[#f5f5f2] sm:text-3xl"><LearningText text={question.prompt} vocabulary={vocabulary} kanji={kanji} examMode={examMode || !showPromptFurigana} /></h2>
      {question.audioUrl || question.audioText ? <AudioControls text={question.audioText} externalUrl={question.audioUrl} metadata={question.audio} autoPlay={autoPlayAudio} className="mt-6" /> : null}
      <div className="mt-7 rounded-xl border border-white/10 bg-[#101b2b]/45 p-4"><p className="mb-3 text-xs text-[#9297a1]">How sure are you? <span className="text-[#676c75]">Optional</span></p><div className="flex flex-wrap gap-2">{confidenceOptions.map(([value, label]) => <button key={value} type="button" onClick={() => !submitted && setConfidence(value)} aria-pressed={confidence === value} className={`rounded-lg border px-3 py-2 text-xs ${confidence === value ? "border-[#e5b85c] bg-[#302818] text-[#f1cf7c]" : "border-[#3f4652] text-[#9297a1] hover:border-[#e5b85c]"}`}>{label}</button>)}</div></div>
      {isOrdering ? <div className="mt-8"><div className="min-h-14 rounded-xl border border-[#4b3a29] bg-[#211d18] p-3 text-lg text-[#e5b85c]" aria-live="polite">{order.length ? <span className="inline-flex flex-wrap gap-x-2 gap-y-1">{order.map((index) => <LearningText key={`${question.id}-ordered-${index}`} text={tokens[index]} vocabulary={vocabulary} kanji={kanji} examMode={examMode} />)}</span> : <span className="text-sm text-[#676c75]">Tap the pieces in natural order.</span>}</div><div className="mt-3 flex flex-wrap gap-2">{tokens.map((token, index) => <button key={`${question.id}-token-${index}`} type="button" disabled={submitted || order.includes(index)} onClick={() => setOrder((value) => [...value, index])} className="rounded-xl border border-[#3f4652] bg-[#17181d]/70 px-4 py-3 text-sm text-[#f5f5f2] enabled:hover:border-[#e5b85c] disabled:cursor-not-allowed disabled:opacity-40"><LearningText text={token} vocabulary={vocabulary} kanji={kanji} examMode={examMode} /></button>)}</div>{order.length ? <button type="button" disabled={submitted} onClick={() => setOrder([])} className="mt-3 text-xs text-[#9297a1] hover:text-[#e5b85c]">Clear order</button> : null}</div> : isTextAnswer ? <label className="mt-8 block text-sm text-[#9297a1]">Your answer<input autoComplete="off" autoFocus={!examMode} aria-label="Your Japanese answer" enterKeyHint="done" value={typedAnswer} onChange={(event) => !submitted && setTypedAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(); }} placeholder={question.answerPlaceholder ?? "Type your answer"} disabled={submitted} className="mt-2 w-full rounded-xl border border-[#3f4652] bg-[#101b2b]/75 px-4 py-3 text-lg text-[#f5f5f2] placeholder:text-[#676c75] focus:border-[#e5b85c] focus:outline-none" /></label> : <div className="mt-8 grid gap-3">{question.options.map((option, index) => <button key={`${question.id}-${option}`} type="button" onClick={() => !submitted && setSelected(index)} disabled={submitted} aria-pressed={selected === index} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm ${selected === index ? "border-[#e34a3f] bg-[#3a2023] text-[#f5f5f2]" : "border-[#292b31] bg-[#17181d]/70 text-[#c3c7ce] hover:border-[#5d3936]"} ${showFeedback && index === question.correctIndex ? "border-[#6fb98f] bg-[#183225] text-[#d9f1e1]" : ""}`}><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#292b31] text-xs text-[#9297a1]">{index + 1}</span><span><LearningText text={option} vocabulary={vocabulary} kanji={kanji} examMode={examMode} /></span></button>)}</div>}
      {showFeedback ? <div className={`mt-7 rounded-xl border p-4 ${isCorrect ? "border-[#376d4c] bg-[#183225]" : "border-[#713b37] bg-[#21191a]"}`} aria-live="polite"><p className={`text-sm font-semibold ${isCorrect ? "text-[#8bcca6]" : "text-[#ef675d]"}`}>{isCorrect ? "Correct" : isOrdering ? "Not quite" : isTextAnswer ? "Not quite" : `Not quite · answer ${question.correctIndex + 1}`}</p><p className="mt-2 text-sm leading-6 text-[#c3c7ce]">{question.explanation}</p>{isOrdering && !isCorrect ? <p className="mt-3 text-sm text-[#e5b85c]">Correct order: {question.correctOrder?.map((index) => tokens[index]).join(" ")}</p> : null}{isTextAnswer && !isCorrect ? <p className="mt-3 text-sm text-[#e5b85c]">Accepted: {question.acceptedAnswers?.join(" / ")}</p> : null}<button type="button" disabled={reported} onClick={() => { recordQuestionAmbiguity(question.id); setReported(true); }} className="mt-4 text-xs text-[#9297a1] underline decoration-dotted underline-offset-4 disabled:no-underline disabled:opacity-60">{reported ? "Thanks — flagged for review" : "Something unclear? Flag this question"}</button></div> : null}
      {showFeedback ? <div className="mt-5 rounded-xl border border-white/10 bg-[#101b2b]/45 p-3"><p className="text-center text-[11px] text-[#9297a1]">Rate this recall · swipe ← Again · ↓ Hard · ↑ Good · Easy →</p><div className="mt-3 grid grid-cols-4 gap-2"><button type="button" onClick={() => next("again")} className="rounded-lg border border-[#713b37] px-2 py-2 text-xs text-[#ef675d]">Again</button><button type="button" onClick={() => next("hard")} className="rounded-lg border border-[#5d4c2c] px-2 py-2 text-xs text-[#e5b85c]">Hard</button><button type="button" onClick={() => next("good")} className="rounded-lg border border-[#315d4b] px-2 py-2 text-xs text-[#8bcca6]">Good</button><button type="button" onClick={() => next("easy")} className="rounded-lg border border-[#4f9ac0] px-2 py-2 text-xs text-[#8cc9e5]">Easy</button></div></div> : null}
      {examMode && submitted ? <p className="mt-7 text-center text-sm text-[#9297a1]" aria-live="polite">Answer recorded. Results will appear at the end.</p> : null}
      <button type="button" disabled={!hasAnswer || submitted} onClick={submit} className="mt-7 w-full rounded-xl bg-[#e34a3f] px-5 py-3.5 text-sm font-semibold text-[#0b0b0d] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#ef675d]">Check answer</button>
      {submitted ? <button type="button" onClick={() => next()} className="mt-3 w-full rounded-xl border border-[#5d3936] px-5 py-3.5 text-sm font-semibold text-[#f5f5f2] hover:border-[#e34a3f]">{position === questions.length - 1 ? "Finish practice" : "Next question"} <span aria-hidden="true">→</span></button> : null}
    </div>
  </div>;
}
