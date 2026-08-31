"use client";

import { useEffect, useState } from "react";

import { AIGenerator } from "@/components/content/ai-generator";
import { ContentRecordEditor, type EditableKind } from "@/components/content/content-record-editor";
import { TopicCoverage } from "@/components/content/topic-coverage";
import {
  getContentReviewStatus,
  getModuleItems,
  parseModuleForReview,
  parseAndValidateModule,
  QUESTION_DRAFT_STORAGE_KEY,
  readValidatedContentDraft,
  validateLearningItem,
  validateModule,
  validatePracticeQuestions,
  type ContentValidationResult,
} from "@/lib/content-validation";
import { readContentDraft, removeContentDraft, writeContentDraft } from "@/lib/content-draft-storage.js";
import type { LessonContentItem } from "@/lib/curriculum";
import { contentSources, getCurriculumBand } from "@/lib/jlpt";
import { readMistakes, readReviewRecords } from "@/lib/session";
import { rankContentCandidates } from "@/lib/content-priority.js";
import { getN5PracticeCoverage, migrateLegacyQuestionPrompts } from "@/lib/questions";
import type { ContentReviewStatus, ContentSource, ExerciseValidationStatus, LearningCategory, N5Module, PracticeQuestion } from "@/lib/types";

type DraftKind = LearningCategory | "grammarContrast" | "lesson";
type ReviewMetadata = { reviewedBy: string; reviewNotes: string };

const draftKinds: DraftKind[] = ["vocabulary", "kanji", "grammar", "reading", "listening", "grammarContrast", "lesson"];

function template(category: DraftKind, id: string, grammarId?: string) {
  if (category === "grammarContrast") {
    return {
      id,
      title: "Topic contrast",
      grammarPointIds: grammarId ? [grammarId] : [],
      explanation: "Compare two nearby forms so the learner can choose the right one in context.",
      examples: [
        { japanese: "これは本です。", translation: "This is a book." },
        { japanese: "これは新しい本です。", translation: "This is a new book." },
      ],
      exercises: ["Choose the form that matches the sentence.", "Rewrite the sentence using the contrasting form."],
    };
  }
  if (category === "lesson") {
    return { id, slug: id, title: "New lesson", subtitle: "はじめの一歩", description: "A short practice loop for one useful Japanese situation.", estimatedMinutes: 10, itemIds: [] };
  }

  const common = { id, slug: id, title: "New draft", jlptLevel: "N5", category, subcategory: "draft", difficulty: 1, prerequisiteIds: [], tags: ["draft"], sourceIds: ["user-draft"] };
  if (category === "vocabulary") {
    return { ...common, writtenForm: "日本語", reading: "にほんご", meanings: ["Japanese language"], partOfSpeech: "noun", exampleSentences: [{ japanese: "日本語を勉強します。", translation: "I study Japanese." }], collocations: ["日本語を話す"], relatedWords: ["英語"], antonyms: [] };
  }
  if (category === "kanji") {
    return { ...common, character: "学", meanings: ["study", "learning"], onyomi: ["ガク"], kunyomi: ["まなぶ"], usefulWords: [{ word: "学生", reading: "がくせい", meaning: "student" }, { word: "大学", reading: "だいがく", meaning: "university" }] };
  }
  if (category === "grammar") {
    return { ...common, pattern: "N は N です", meaning: "A is B", formation: "N は N です", intuition: "は introduces the topic and です makes the statement polite.", usageConditions: ["Use は to mark the topic.", "Use です for a polite statement."], examples: [{ japanese: "私は学生です。", translation: "I am a student." }, { japanese: "これは本です。", translation: "This is a book." }], commonMistakes: ["Do not use を to mark the topic."], contrastIds: [], practiceQuestionIds: [] };
  }
  if (category === "reading") {
    return { ...common, passage: "私は学生です。毎日、日本語を勉強します。", translation: "I am a student. I study Japanese every day.", vocabularyIds: [], grammarIds: [], kanjiIds: [], estimatedDifficulty: 1, questions: [{ prompt: "何を勉強しますか。", options: ["日本語", "英語"], correctAnswer: 0, questionType: "short passage detail", explanation: "The passage says 日本語を勉強します。" }] };
  }
  return { ...common, situation: "A learner says what they study.", audioUrl: null, voice: "ja-JP", speed: 0.9, sourceType: "tts", transcript: "A：何を勉強しますか。\nB：日本語を勉強します。", questions: [{ prompt: "何を勉強しますか。", answers: ["日本語", "英語"], correctAnswer: 0, questionType: "key point", explanation: "The speaker says 日本語を勉強します。" }] };
}

function Health({ label, result }: Readonly<{ label: string; result: ContentValidationResult }>) {
  return <div className="rounded-xl border border-white/10 bg-[#101b2b]/70 p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm text-[#f5f5f2]">{label}</p><span className={result.valid ? "text-[#6fb98f]" : "text-[#e34a3f]"}>{result.valid ? result.warnings.length ? "Ready · review" : "Ready" : `${result.errors.length} errors`}</span></div><p className="mt-2 text-xs text-[#9297a1]">{result.checked} records checked{result.warnings.length ? ` · ${result.warnings.length} warnings` : ""}</p></div>;
}

function CoverageHealth({ coverage }: Readonly<{ coverage: ReturnType<typeof getN5PracticeCoverage> }>) {
  return <div className="rounded-xl border border-white/10 bg-[#101b2b]/70 p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm text-[#f5f5f2]">N5 practice coverage</p><span className={coverage.complete ? "text-[#6fb98f]" : "text-[#e34a3f]"}>{coverage.complete ? "Complete" : "Needs work"}</span></div><p className="mt-2 text-xs text-[#9297a1]">{coverage.coveredItemCount} / {coverage.itemCount} items · {coverage.questionCount} active questions</p>{coverage.missingFamilies.length ? <p className="mt-1 text-[10px] text-[#ef675d]">Missing families: {coverage.missingFamilies.join(", ")}</p> : null}{coverage.uncoveredItemIds.length ? <p className="mt-1 truncate text-[10px] text-[#ef675d]" title={coverage.uncoveredItemIds.join(", ")}>Uncovered items: {coverage.uncoveredItemIds.join(", ")}</p> : null}</div>;
}

function Issues({ result }: Readonly<{ result: ContentValidationResult }>) {
  if (!result.errors.length && !result.warnings.length) return <section className="rounded-xl border border-[#315d4b] bg-[#162b26]/70 p-5"><p className="eyebrow text-[#6fb98f]">Content gate clear</p><p className="mt-2 text-sm text-[#c6ded2]">This package has the required fields, references, and answer structure.</p></section>;
  return <section className={`rounded-xl p-5 ${result.errors.length ? "border border-[#713b37] bg-[#21191a]/70" : "border border-[#5d4c2c] bg-[#2b2418]/70"}`}><p className={`eyebrow ${result.errors.length ? "text-[#e34a3f]" : "text-[#e5b85c]"}`}>{result.errors.length ? "Needs attention" : "Review warnings"}</p><ul className="mt-3 space-y-2 text-sm text-[#f0c2bd]">{[...result.errors, ...result.warnings].slice(0, 12).map((issue) => <li key={`${issue.severity}-${issue.path}-${issue.message}`}><span className="font-mono text-xs text-[#e5b85c]">{issue.path}</span> — {issue.message}</li>)}</ul>{result.errors.length + result.warnings.length > 12 ? <p className="mt-3 text-xs text-[#9297a1]">Showing the first 12 issues.</p> : null}</section>;
}

function downloadJson(raw: string, filename: string) {
  const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function itemPreview(item: LessonContentItem) {
  if (item.category === "vocabulary") return { japanese: item.writtenForm, reading: item.reading, detail: item.meanings.slice(0, 2).join(" · ") };
  if (item.category === "kanji") return { japanese: item.character, reading: item.kunyomi[0] ?? item.onyomi[0] ?? "", detail: item.meanings.slice(0, 2).join(" · ") };
  if (item.category === "grammar") return { japanese: item.pattern, reading: "", detail: item.meaning };
  if (item.category === "reading") return { japanese: item.title, reading: "", detail: item.passage.split("\n")[0] };
  return { japanese: item.title, reading: "", detail: item.situation };
}

function ContentReviewCard({ item, sourceById, onEdit, onReview }: Readonly<{
  item: LessonContentItem & { reason: string };
  sourceById: Map<string, ContentSource>;
  onEdit: (kind?: EditableKind, id?: string) => void;
  onReview?: (id: string, status: ContentReviewStatus) => void;
}>) {
  const preview = itemPreview(item);
  const reviewStatus = getContentReviewStatus(item);
  const itemBand = getCurriculumBand(item);
  const provenance = (item.sourceIds ?? []).map((id) => {
    const source = sourceById.get(id);
    return source ? source.name + (source.sha256 ? " · " + source.sha256.slice(0, 12) : "") : id;
  }).join(" · ");

  return <details className="group rounded-lg border border-white/10 bg-[#101b2b]/75 text-left transition open:border-[#e5b85c]/60">
    <summary className="cursor-pointer list-none p-3 outline-none focus-visible:ring-2 focus-visible:ring-[#e5b85c]/60">
      <div className="flex items-start justify-between gap-3">
        <span className="jp-serif text-xl text-[#f5f5f2]">{preview.reading ? <ruby>{preview.japanese}<rt className="text-[.45em] text-[#e5b85c]">{preview.reading}</rt></ruby> : preview.japanese}</span>
        <div className="flex shrink-0 flex-col items-end gap-1 text-[10px] uppercase tracking-[.12em]">
          <span className="text-[#e5b85c]">{item.category}</span>
          {reviewStatus !== "approved" ? <span className={reviewStatus === "pending" ? "text-[#e5b85c]" : "text-[#ef675d]"}>{reviewStatus}</span> : null}
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#9297a1]">{preview.detail}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-[.1em] text-[#676c75]">
        <span title={provenance || undefined}>{provenance || "source pending"}</span>
        <span>{item.classification ? item.classification.band + " · " + item.classification.confidence + (item.classification.conflict ? " · conflict" : "") : itemBand + " · inferred"}</span>
        <span title={item.reason}>{item.reason}</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="truncate font-mono text-[10px] text-[#676c75]">{item.id}</span>
        <span className="shrink-0 text-[10px] uppercase tracking-[.1em] text-[#e5b85c]">Click to expand</span>
      </div>
    </summary>
    <div className="border-t border-white/10 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[.1em] text-[#e5b85c]">Full record</p>
        <button type="button" onClick={() => onEdit(item.category, item.id)} className="rounded-lg border border-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#f1cf7c] hover:bg-[#302818]">Edit record</button>
      </div>
      <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-white/10 bg-[#0d1522]/90 p-3 font-mono text-[11px] leading-5 text-[#c3c7ce]">{JSON.stringify(item, null, 2)}</pre>
      {onReview && reviewStatus === "pending" ? <div className="mt-3 flex gap-2 border-t border-white/10 pt-3"><button type="button" onClick={() => onReview(item.id, "approved")} className="rounded-lg bg-[#6fb98f] px-3 py-2 text-xs font-semibold text-[#0b0b0d] hover:bg-[#8bcca6]">Approve</button><button type="button" onClick={() => onReview(item.id, "rejected")} className="rounded-lg border border-[#713b37] px-3 py-2 text-xs font-semibold text-[#ef675d] hover:border-[#ef675d]">Reject</button></div> : null}
    </div>
  </details>;
}

function ContentReview({ module, onEdit, onReview }: Readonly<{ module: N5Module; onEdit: (kind?: EditableKind, id?: string) => void; onReview?: (id: string, status: ContentReviewStatus) => void }>) {
  const [statusFilter, setStatusFilter] = useState<"pending" | "all">(() => getModuleItems(module).some((item) => getContentReviewStatus(item) === "pending") ? "pending" : "all");
  const [levelFilter, setLevelFilter] = useState<"all" | "N5" | "N4">("all");
  const [bandFilter, setBandFilter] = useState<"all" | "core" | "extended" | "bridge">("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const allItems = getModuleItems(module);
  const pendingItems = allItems.filter((item) => getContentReviewStatus(item) === "pending");
  const sourceOptions = [...new Set(allItems.flatMap((item) => item.sourceIds ?? []))].sort();
  const filteredItems = allItems.filter((item) => {
    if (statusFilter === "pending" && getContentReviewStatus(item) !== "pending") return false;
    if (levelFilter !== "all" && item.jlptLevel !== levelFilter) return false;
    if (bandFilter !== "all" && getCurriculumBand(item) !== bandFilter) return false;
    if (sourceFilter !== "all" && !(item.sourceIds ?? []).includes(sourceFilter)) return false;
    if (query.trim() && ![item.id, item.title, item.category, item.subcategory, ...(item.tags ?? [])].join(" ").toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) return false;
    return true;
  });
  const rankedItems = rankContentCandidates(filteredItems, readReviewRecords(), readMistakes(), filteredItems.length) as Array<LessonContentItem & { reason: string }>;
  const pageSize = 60;
  const pageCount = Math.ceil(rankedItems.length / pageSize);
  const items = rankedItems.slice(page * pageSize, (page + 1) * pageSize);
  const sourceById = new Map((module.sourceManifest ?? []).map((source) => [source.id, source]));
  useEffect(() => setPage(0), [statusFilter, levelFilter, bandFilter, sourceFilter, query]);

  return <div className="rounded-xl border border-white/10 bg-[#0d1522]/65 p-4">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm text-[#f5f5f2]">Content review queue</p>
        <p className="mt-1 text-xs text-[#9297a1]">Pending source records appear first. Expand a card to inspect the full record before approving or rejecting it.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[#9297a1]">{statusFilter === "pending" ? pendingItems.length + " pending" : allItems.length + " total"}</span>
        <button type="button" onClick={() => setStatusFilter("pending")} className={"rounded-lg px-3 py-2 text-xs " + (statusFilter === "pending" ? "bg-[#e5b85c] text-[#0b0b0d]" : "border border-[#3f4652] text-[#9297a1]")}>Pending</button>
        <button type="button" onClick={() => setStatusFilter("all")} className={"rounded-lg px-3 py-2 text-xs " + (statusFilter === "all" ? "bg-[#e5b85c] text-[#0b0b0d]" : "border border-[#3f4652] text-[#9297a1]")}>All records</button>
        <button type="button" onClick={() => onEdit()} className="rounded-lg border border-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#f1cf7c] hover:bg-[#302818]">Edit records</button>
      </div>
    </div>
    <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <input aria-label="Search review records" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, ID, topic…" className="rounded-lg border border-[#3f4652] bg-[#101b2b]/90 px-3 py-2.5 text-xs text-[#f5f5f2] outline-none placeholder:text-[#676c75] focus:border-[#e5b85c]" />
      <select aria-label="Filter JLPT level" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value as typeof levelFilter)} className="rounded-lg border border-[#3f4652] bg-[#101b2b]/90 px-3 py-2.5 text-xs text-[#f5f5f2] outline-none focus:border-[#e5b85c]">
        <option value="all">All levels</option>
        <option value="N5">N5 core path</option>
        <option value="N4">N4 bridge</option>
      </select>
      <select aria-label="Filter curriculum band" value={bandFilter} onChange={(event) => setBandFilter(event.target.value as typeof bandFilter)} className="rounded-lg border border-[#3f4652] bg-[#101b2b]/90 px-3 py-2.5 text-xs text-[#f5f5f2] outline-none focus:border-[#e5b85c]">
        <option value="all">All curriculum bands</option>
        <option value="core">Core</option>
        <option value="extended">Extended</option>
        <option value="bridge">Bridge</option>
      </select>
      <select aria-label="Filter source" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="min-w-0 rounded-lg border border-[#3f4652] bg-[#101b2b]/90 px-3 py-2.5 text-xs text-[#f5f5f2] outline-none placeholder:text-[#676c75] focus:border-[#e5b85c]">
        <option value="all">All sources</option>
        {sourceOptions.map((source) => <option key={source} value={source}>{source}</option>)}
      </select>
    </div>
    {!items.length ? <div className="rounded-lg border border-[#315d4b] bg-[#162b26]/70 p-4">
      <p className="text-sm text-[#c3c7ce]">No records match this review filter.</p>
      <button type="button" onClick={() => { setStatusFilter("all"); setLevelFilter("all"); setBandFilter("all"); setSourceFilter("all"); setQuery(""); }} className="mt-2 text-xs font-semibold text-[#e5b85c] hover:text-[#f1cf7c]">Clear filters →</button>
    </div> : <><div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-[#676c75]">Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filteredItems.length)} of {filteredItems.length} matching records.</p>
      {pageCount > 1 ? <div className="flex items-center gap-2">
        <button type="button" disabled={page === 0} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] enabled:hover:border-[#e5b85c] disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
        <span className="text-xs text-[#9297a1]">Page {page + 1} of {pageCount}</span>
        <button type="button" disabled={page === pageCount - 1} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] enabled:hover:border-[#e5b85c] disabled:cursor-not-allowed disabled:opacity-40">Next</button>
      </div> : null}
    </div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <ContentReviewCard key={item.id} item={item} sourceById={sourceById} onEdit={onEdit} onReview={onReview} />)}</div></>}
  </div>;
}

function questionsForReview(raw: string, fallback: PracticeQuestion[]) {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value as PracticeQuestion[] : fallback;
  } catch {
    return fallback;
  }
}

function QuestionReview({ raw, fallback, onReview, onEdit }: Readonly<{ raw: string; fallback: PracticeQuestion[]; onReview?: (id: string, status: ExerciseValidationStatus, metadata: ReviewMetadata) => void; onEdit: () => void }>) {
  const [reviewers, setReviewers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const allQuestions = questionsForReview(raw, fallback).filter((question) => question.validationStatus !== "rejected" && question.review?.status !== "approved");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const questionPageSize = 20;
  const filteredQuestions = allQuestions.filter((question) => !query.trim() || [question.id, question.itemId, question.category, question.questionType, question.prompt].join(" ").toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const questionPageCount = Math.ceil(filteredQuestions.length / questionPageSize);
  const safePage = questionPageCount ? Math.min(page, questionPageCount - 1) : 0;
  const visibleQuestions = filteredQuestions.slice(safePage * questionPageSize, (safePage + 1) * questionPageSize);
  useEffect(() => setPage(0), [query]);
  useEffect(() => {
    if (questionPageCount > 0 && page >= questionPageCount) setPage(questionPageCount - 1);
  }, [page, questionPageCount]);
  if (!allQuestions.length) return <div className="rounded-xl border border-white/10 bg-[#0d1522]/65 p-5"><p className="text-sm text-[#f5f5f2]">No drafts waiting for review.</p><p className="mt-1 text-xs text-[#9297a1]">Generate a question above and it will appear here. Approved drafts move into the active question pipeline.</p></div>;

  return <div className="rounded-xl border border-white/10 bg-[#0d1522]/65 p-4"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-[#f5f5f2]">Pending question drafts</p><p className="mt-1 text-xs text-[#9297a1]">Approve good drafts to move them into the active pipeline, or reject them to keep them out.</p></div><button type="button" onClick={onEdit} className="rounded-lg border border-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#f1cf7c] hover:bg-[#302818]">Advanced JSON</button></div><div className="mb-3 flex flex-wrap items-center gap-2"><input aria-label="Search pending questions" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search question ID, prompt, or type…" className="min-w-0 flex-1 rounded-lg border border-[#3f4652] bg-[#101b2b]/90 px-3 py-2.5 text-xs text-[#f5f5f2] outline-none placeholder:text-[#676c75] focus:border-[#e5b85c]" /><span className="text-xs text-[#9297a1]">Showing {visibleQuestions.length ? safePage * questionPageSize + 1 : 0}–{safePage * questionPageSize + visibleQuestions.length} of {filteredQuestions.length} matching · {allQuestions.length} pending</span></div>{!filteredQuestions.length ? <p className="rounded-lg border border-white/10 bg-[#101b2b]/75 p-4 text-xs text-[#9297a1]">No pending questions match this search.</p> : <><div className="space-y-2">{visibleQuestions.map((question, index) => { const choices = Array.isArray(question.options) ? question.options : []; const isOrdering = question.questionType === "sentence ordering"; const answer = question.answerMode === "text" ? question.acceptedAnswers?.[0] : isOrdering && question.tokens && question.correctOrder ? question.correctOrder.map((tokenIndex) => question.tokens?.[tokenIndex]).join(" ") : choices[question.correctIndex]; const questionId = question.id; const reviewer = reviewers[questionId] ?? question.review?.reviewedBy ?? "owner"; const reviewNotes = notes[questionId] ?? question.review?.reviewNotes ?? ""; return <article key={question.id ?? index} className="rounded-lg border border-white/10 bg-[#101b2b]/75 p-4"><div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[.12em] text-[#e5b85c]"><span>{question.category ?? "unknown"}</span><span className="text-[#676c75]">{question.questionType ?? "question"}</span><span className="text-[#9297a1]">draft</span></div><p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#f5f5f2]">{question.prompt ?? "Untitled question"}</p>{choices.length && !isOrdering ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{choices.map((choice, choiceIndex) => <span key={`${choice}-${choiceIndex}`} className={`rounded-md px-3 py-2 text-xs ${choiceIndex === question.correctIndex ? "bg-[#183225] text-[#8bcca6]" : "bg-[#17181d] text-[#9297a1]"}`}>{choice}</span>)}</div> : <p className="mt-3 text-xs text-[#8bcca6]">{isOrdering ? "Correct order: " : "Accepted: "}{answer ?? "not set"}</p>}<p className="mt-3 text-xs leading-5 text-[#9297a1]">{question.explanation ?? "No explanation yet."}</p>{onReview ? <div className="mt-4 grid gap-2 border-t border-white/10 pt-3 sm:grid-cols-2"><label className="text-[11px] text-[#9297a1]">Reviewed by<input value={reviewer} onChange={(event) => setReviewers((current) => ({ ...current, [questionId]: event.target.value }))} className="mt-1 w-full rounded-lg border border-[#3f4652] bg-[#101b2b] px-3 py-2 text-xs text-[#f5f5f2] outline-none focus:border-[#e5b85c]" /></label><label className="text-[11px] text-[#9297a1]">Review notes<textarea value={reviewNotes} onChange={(event) => setNotes((current) => ({ ...current, [questionId]: event.target.value }))} className="mt-1 min-h-10 w-full rounded-lg border border-[#3f4652] bg-[#101b2b] px-3 py-2 text-xs text-[#f5f5f2] outline-none focus:border-[#e5b85c]" /></label><div className="flex flex-wrap gap-2 sm:col-span-2"><button type="button" onClick={() => onReview(questionId, "validated", { reviewedBy: reviewer, reviewNotes })} className="rounded-lg bg-[#6fb98f] px-3 py-2 text-xs font-semibold text-[#0b0b0d]">Approve · add to pipeline</button><button type="button" onClick={() => onReview(questionId, "rejected", { reviewedBy: reviewer, reviewNotes })} className="rounded-lg border border-[#713b37] px-3 py-2 text-xs font-semibold text-[#ef675d]">Reject</button></div></div> : null}</article>; })}</div><div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3"><span className="text-xs text-[#9297a1]">Page {safePage + 1} of {questionPageCount}</span><div className="flex gap-2"><button type="button" disabled={safePage === 0} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] enabled:hover:border-[#e5b85c] disabled:cursor-not-allowed disabled:opacity-40">Previous</button><button type="button" disabled={safePage >= questionPageCount - 1} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] enabled:hover:border-[#e5b85c] disabled:cursor-not-allowed disabled:opacity-40">Next</button></div></div></>}</div>;
}

export function ContentStudio({ seed: initialSeed, seedHealth, questionHealth, practiceCoverage, questions, knownItemIds, sources = contentSources }: Readonly<{ seed: N5Module; seedHealth: ContentValidationResult; questionHealth: ContentValidationResult; practiceCoverage: ReturnType<typeof getN5PracticeCoverage>; questions: PracticeQuestion[]; knownItemIds: string[]; sources?: ContentSource[] }>) {
  const [seed, setSeed] = useState(initialSeed);
  const [raw, setRaw] = useState(() => JSON.stringify(seed, null, 2));
  const [result, setResult] = useState<ContentValidationResult>(seedHealth);
  const [questionRaw, setQuestionRaw] = useState(() => JSON.stringify(questions, null, 2));
  const [questionResult, setQuestionResult] = useState<ContentValidationResult>(questionHealth);
  const [message, setMessage] = useState("");
  const [showContentIssues, setShowContentIssues] = useState(false);
  const [contentView, setContentView] = useState<"review" | "form" | "json">("review");
  const [editorKind, setEditorKind] = useState<EditableKind>("vocabulary");
  const [editorRecordId, setEditorRecordId] = useState("");
  const [questionView, setQuestionView] = useState<"review" | "edit">("review");
  const parsedDraft = parseAndValidateModule(raw);
  const coverageModule = parsedDraft.value ?? parseModuleForReview(raw) ?? seed;
  const currentOrSavedDraft = parsedDraft.value ?? parseModuleForReview(raw) ?? readValidatedContentDraft();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/content/review-package", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Review package request failed.");
        const next = parseModuleForReview(await response.text());
        if (!next) throw new Error("Review package is invalid.");
        return next;
      })
      .then((next) => {
        if (cancelled) return;
        setSeed(next);
        setRaw(JSON.stringify(next, null, 2));
        setResult(validateModule(next));
        setMessage("Loaded the full staged review package.");
      })
      .catch(() => {
        if (!cancelled) setMessage("The full review package could not load; the bundled curriculum is shown.");
      });
    return () => { cancelled = true; };
  }, []);

  const questionIds = () => {
    const draft = currentOrSavedDraft;
    return new Set([...knownItemIds, ...(draft ? getModuleItems(draft).map((item) => item.id) : [])]);
  };

  const questionCategories = () => {
    const draft = currentOrSavedDraft;
    return new Map([...getModuleItems(seed), ...(draft ? getModuleItems(draft) : [])].map((item) => [item.id, item.category]));
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const saved = await readContentDraft();
      if (cancelled) return;
      const savedResult = saved ? parseAndValidateModule(saved) : null;
      const savedDraft = savedResult?.value ?? (saved ? parseModuleForReview(saved) : null);
      const savedIsSmaller = Boolean(savedDraft && getModuleItems(savedDraft).length < getModuleItems(seed).length);
      const activeDraft = savedIsSmaller ? seed : savedDraft ?? seed;
      if (savedResult?.value && !savedIsSmaller) {
        setRaw(saved);
        setResult(savedResult.result);
        setShowContentIssues(false);
        setMessage("Loaded the last saved content draft.");
      } else if (saved && !savedIsSmaller) {
        const reviewDraft = parseModuleForReview(saved);
        if (reviewDraft) {
          setRaw(saved);
          setResult(parseAndValidateModule(saved).result);
          setShowContentIssues(false);
          setMessage("Loaded the in-progress review draft. Fix its issues before publishing.");
        } else {
          setRaw(JSON.stringify(seed, null, 2));
          setResult(seedHealth);
          setShowContentIssues(false);
          setMessage("The saved draft was not a content package, so the bundled curriculum is shown.");
        }
      } else {
        setRaw(JSON.stringify(seed, null, 2));
        setResult(seedHealth);
        setShowContentIssues(false);
        setMessage(savedIsSmaller ? "Kept the larger staged review package; the smaller draft was not deleted." : "Loaded the bundled curriculum.");
      }

      const savedQuestions = window.localStorage.getItem(QUESTION_DRAFT_STORAGE_KEY);
      if (!savedQuestions) return;
      try {
        const draftItems = getModuleItems(activeDraft);
        const ids = new Set([...knownItemIds, ...draftItems.map((item) => item.id)]);
        const categories = new Map([...getModuleItems(seed), ...draftItems].map((item) => [item.id, item.category]));
        const migratedQuestions = migrateLegacyQuestionPrompts(JSON.parse(savedQuestions), activeDraft);
        const savedQuestionResult = validatePracticeQuestions(migratedQuestions, ids, categories);
        if (savedQuestionResult.valid) {
          setQuestionRaw(JSON.stringify(migratedQuestions, null, 2));
          setQuestionResult(savedQuestionResult);
        } else {
          setQuestionRaw(JSON.stringify(questions, null, 2));
          setQuestionResult(questionHealth);
          setMessage("The saved question draft was incomplete, so the bundled question bank is shown. Reset questions to clear the old copy.");
        }
      } catch {
        setQuestionRaw(JSON.stringify(questions, null, 2));
        setQuestionResult(questionHealth);
        setMessage("The saved question draft was invalid, so the bundled question bank is shown. Reset questions to clear the old copy.");
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [knownItemIds, questionHealth, questions, seed, seedHealth]);

  const validate = () => {
    const next = parseAndValidateModule(raw).result;
    setResult(next);
    setShowContentIssues(true);
    setMessage(next.valid ? "Package is ready to save as a local draft." : "Fix the listed errors before saving.");
  };

  const saveDraft = async () => {
    const parsed = parseAndValidateModule(raw);
    const next = parsed.result;
    setResult(next);
    setShowContentIssues(true);
    if (!parseModuleForReview(raw)) {
      setMessage("Fix the JSON structure before saving this draft.");
      return;
    }
    try {
      const storage = await writeContentDraft(raw);
      window.dispatchEvent(new Event("michi-content-draft-updated"));
      setMessage(next.valid ? `Saved on this device (${storage}).` : `Saved the in-progress review draft (${storage}). Publishing stays locked until it validates.`);
    } catch {
      setMessage("Could not persist this large draft. Export the JSON before leaving this page.");
    }
  };

  const validateQuestions = () => {
    try {
      const next = validatePracticeQuestions(JSON.parse(questionRaw), questionIds(), questionCategories());
      setQuestionResult(next);
      setMessage(next.valid ? "Question set is ready to save." : "Fix the question errors before saving.");
      return next;
    } catch (error) {
      const next = { valid: false, checked: 0, errors: [{ path: "json", message: error instanceof Error ? error.message : "Invalid JSON.", severity: "error" as const }], warnings: [] };
      setQuestionResult(next);
      setMessage("Fix the question JSON before saving.");
      return next;
    }
  };

  const saveQuestionDraft = () => {
    const next = validateQuestions();
    if (!next.valid) return;
    window.localStorage.setItem(QUESTION_DRAFT_STORAGE_KEY, questionRaw);
    window.dispatchEvent(new Event("michi-question-draft-updated"));
    setMessage("Saved question set locally on this device.");
  };

  const resetQuestions = () => {
    setQuestionRaw(JSON.stringify(questions, null, 2));
    window.localStorage.removeItem(QUESTION_DRAFT_STORAGE_KEY);
    setQuestionResult(questionHealth);
    window.dispatchEvent(new Event("michi-question-draft-updated"));
    setMessage("Reset to the bundled question bank.");
  };

  const addGeneratedQuestion = (question: PracticeQuestion) => {
    try {
      const current = JSON.parse(questionRaw) as unknown;
      const existing = Array.isArray(current) ? current.filter((entry) => typeof entry === "object" && entry !== null && (entry as { id?: unknown }).id !== question.id) : [];
      const next = [question, ...existing];
      setQuestionRaw(JSON.stringify(next, null, 2));
      setQuestionResult(validatePracticeQuestions(next, questionIds(), questionCategories()));
      setQuestionView("review");
      setMessage("AI draft added to pending review.");
    } catch {
      setMessage("Could not add the generated question to this draft.");
    }
  };

  const updateQuestionStatus = (questionId: string, status: ExerciseValidationStatus, metadata: ReviewMetadata) => {
    try {
      const current = JSON.parse(questionRaw) as unknown;
      if (!Array.isArray(current)) throw new Error("Question draft is not an array.");
      const reviewedAt = new Date().toISOString();
      const next = current.map((entry) => {
        if (typeof entry !== "object" || entry === null || (entry as { id?: unknown }).id !== questionId) return entry;
        const record = entry as Record<string, unknown>;
        const review = record.review;
        const reviewData = typeof review === "object" && review !== null && !Array.isArray(review) ? review as Record<string, unknown> : {};
        return { ...record, validationStatus: status, review: { ...reviewData, status: status === "validated" ? "approved" : "rejected", reviewedBy: metadata.reviewedBy.trim() || "owner", reviewedAt, reviewNotes: metadata.reviewNotes.trim() } };
      });
      const nextRaw = JSON.stringify(next, null, 2);
      const nextResult = validatePracticeQuestions(next, questionIds(), questionCategories());
      setQuestionRaw(nextRaw);
      setQuestionResult(nextResult);
      if (nextResult.valid) {
        window.localStorage.setItem(QUESTION_DRAFT_STORAGE_KEY, nextRaw);
        window.dispatchEvent(new Event("michi-question-draft-updated"));
      }
      setMessage(status === "validated" ? "Approved and added to the active question pipeline." : "Rejected question draft.");
    } catch {
      setMessage("Could not update that question draft.");
    }
  };

  const updateContentStatus = (itemId: string, status: ContentReviewStatus) => {
    try {
      const packageData = JSON.parse(raw) as Record<string, unknown>;
      for (const key of ["vocabulary", "kanji", "grammar", "readings", "listening"]) {
        const records = packageData[key];
        if (!Array.isArray(records)) continue;
        const index = records.findIndex((entry) => typeof entry === "object" && entry !== null && !Array.isArray(entry) && (entry as { id?: unknown }).id === itemId);
        if (index < 0) continue;
        const record = records[index];
        if (typeof record !== "object" || record === null || Array.isArray(record)) break;
        if (status === "approved") {
          const item = record as Record<string, unknown>;
          const itemValidation = validateLearningItem(item);
          const assignedToRealLesson = Object.values(packageData.course && typeof packageData.course === "object" && !Array.isArray(packageData.course) ? (packageData.course as Record<string, unknown>).chapters ?? [] : []).some((chapter) => typeof chapter === "object" && chapter !== null && !Array.isArray(chapter) && Array.isArray((chapter as Record<string, unknown>).lessons) && ((chapter as Record<string, unknown>).lessons as unknown[]).some((lesson) => typeof lesson === "object" && lesson !== null && !Array.isArray(lesson) && (lesson as Record<string, unknown>).id !== "lesson-openjlpt-review" && Array.isArray((lesson as Record<string, unknown>).itemIds) && ((lesson as Record<string, unknown>).itemIds as unknown[]).includes(itemId)));
          if (!itemValidation.valid) {
            setMessage(`Enrich this record before approval: ${itemValidation.errors[0]?.message ?? "required learner fields are missing."}`);
            return;
          }
          if (!assignedToRealLesson) {
            setMessage("Assign this record to a real Journey lesson before approval.");
            return;
          }
        }
        records[index] = { ...(record as Record<string, unknown>), reviewStatus: status };
        const nextRaw = JSON.stringify(packageData, null, 2);
        setRaw(nextRaw);
        setResult(parseAndValidateModule(nextRaw).result);
        setShowContentIssues(false);
        void writeContentDraft(nextRaw).then(() => {
          window.dispatchEvent(new Event("michi-content-draft-updated"));
          setMessage(status === "approved" ? "Approved and added to the learner pipeline." : "Rejected source record.");
        }).catch(() => setMessage("Updated this page, but the large draft could not be persisted. Export JSON before leaving."));
        return;
      }
      setMessage("Could not find that record in the draft.");
    } catch {
      setMessage("Could not update that content record.");
    }
  };

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    const next = await file.text();
    setRaw(next);
    const validation = parseAndValidateModule(next).result;
    setResult(validation);
    setShowContentIssues(false);
    setContentView("review");
    setMessage(validation.valid ? "Imported and validated." : "Imported, but it needs fixes.");
  };

  const addTemplate = (category: DraftKind) => {
    try {
      const packageData = JSON.parse(raw) as Record<string, unknown>;
      const id = `${category}-draft-${Date.now()}`;
      if (category === "lesson") {
        const course = packageData.course as Record<string, unknown> | undefined;
        const chapters = course?.chapters;
        if (!course || !Array.isArray(chapters) || !chapters[0] || typeof chapters[0] !== "object") throw new Error("The package has no chapter to add a lesson to.");
        const chapter = chapters[0] as Record<string, unknown>;
        if (!Array.isArray(chapter.lessons)) throw new Error("The first chapter has no lessons array.");
        chapter.lessons = [template(category, id), ...chapter.lessons];
      } else {
        const key = category === "grammarContrast" ? "grammarContrasts" : category === "reading" ? "readings" : category;
        if (!Array.isArray(packageData[key])) throw new Error(`The package has no ${key} array.`);
        const grammar = packageData.grammar;
        const grammarId = Array.isArray(grammar) && typeof grammar[0] === "object" && grammar[0] !== null && typeof (grammar[0] as Record<string, unknown>).id === "string" ? (grammar[0] as Record<string, unknown>).id as string : undefined;
        packageData[key] = [template(category, id, grammarId), ...packageData[key]];
      }
      const next = JSON.stringify(packageData, null, 2);
      setRaw(next);
      setResult(parseAndValidateModule(next).result);
      setShowContentIssues(false);
      setEditorKind(category);
      setEditorRecordId(id);
      setContentView("form");
      setMessage(`Added a ${category} starter with example fields. Edit it, then validate.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add a starter.");
    }
  };

  const openRecordEditor = (kind: EditableKind = editorKind, id = editorRecordId) => {
    setEditorKind(kind);
    setEditorRecordId(id);
    setContentView("form");
  };

  const updateFormRaw = (nextRaw: string, recordId: string) => {
    setRaw(nextRaw);
    setEditorRecordId(recordId);
    setResult(parseAndValidateModule(nextRaw).result);
    setShowContentIssues(false);
    setMessage("Updated the draft. Validate before saving.");
  };

  const resetDraft = () => {
    const next = JSON.stringify(seed, null, 2);
    void removeContentDraft().catch(() => setMessage("Reset this page, but the saved draft could not be cleared."));
    window.dispatchEvent(new Event("michi-content-draft-updated"));
    setRaw(next);
    setResult(seedHealth);
    setShowContentIssues(false);
    setContentView("review");
    setMessage("Reset to the bundled curriculum.");
  };

  return <div className="space-y-7">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Health label="Last curriculum validation" result={result} /><Health label="Practice question bank" result={questionResult} /><CoverageHealth coverage={practiceCoverage} /></div>
    <TopicCoverage module={coverageModule} />
    <AIGenerator items={getModuleItems(coverageModule).filter((item) => getContentReviewStatus(item) === "approved")} onAdd={addGeneratedQuestion} />

    <section className="rounded-xl border border-[#3f3427] bg-[#211d18]/65 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Curriculum package</p><h2 className="mt-1 text-xl font-medium text-[#f5f5f2]">Review the path, then edit it.</h2><p className="mt-1 max-w-2xl text-sm text-[#9297a1]">Scan readable cards first. Edit fields directly, or use Advanced JSON only for imports and bulk changes.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={resetDraft} className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-[#c3c7ce] hover:border-[#e5b85c] hover:text-[#f1cf7c]">Reset draft</button><label className="w-fit cursor-pointer rounded-xl border border-[#5d3936] px-4 py-3 text-sm font-semibold text-[#f5f5f2] hover:border-[#e34a3f]">Import JSON<input type="file" accept="application/json,.json" className="sr-only" onChange={(event) => void loadFile(event.target.files?.[0])} /></label></div></div>
      <div className="mt-5 flex flex-wrap gap-2"><span className="self-center text-xs text-[#9297a1]">New starter:</span>{draftKinds.map((category) => <button key={category} type="button" onClick={() => addTemplate(category)} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#e5b85c] hover:text-[#f1cf7c]">{category === "grammarContrast" ? "grammar contrast" : category}</button>)}</div>
      <div className="mt-5 flex flex-wrap gap-2 border-b border-white/10 pb-3"><button type="button" onClick={() => setContentView("review")} className={`rounded-lg px-3 py-2 text-xs ${contentView === "review" ? "bg-[#e5b85c] text-[#0b0b0d]" : "border border-[#3f4652] text-[#9297a1]"}`}>Review cards</button><button type="button" onClick={() => setContentView("form")} className={`rounded-lg px-3 py-2 text-xs ${contentView === "form" ? "bg-[#e5b85c] text-[#0b0b0d]" : "border border-[#3f4652] text-[#9297a1]"}`}>Edit records</button><button type="button" onClick={() => setContentView("json")} className={`rounded-lg px-3 py-2 text-xs ${contentView === "json" ? "bg-[#3a2023] text-[#f5f5f2]" : "border border-[#3f4652] text-[#9297a1]"}`}>Advanced JSON</button></div>
      {contentView === "form" ? <div className="mt-5"><ContentRecordEditor raw={raw} fallback={seed} preferredKind={editorKind} preferredId={editorRecordId} onChange={updateFormRaw} onAdd={addTemplate} sources={sources} /></div> : contentView === "json" ? <textarea value={raw} onChange={(event) => { setRaw(event.target.value); setShowContentIssues(false); }} spellCheck={false} aria-label="Content package JSON" className="mt-5 min-h-[28rem] w-full rounded-xl border border-[#3f4652] bg-[#0d1522]/90 p-4 font-mono text-xs leading-6 text-[#d8dde4] outline-none focus:border-[#e5b85c]" /> : <div className="mt-5"><ContentReview module={coverageModule} onEdit={openRecordEditor} onReview={updateContentStatus} /></div>}
      <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" onClick={validate} className="rounded-xl bg-[#e34a3f] px-4 py-3 text-sm font-semibold text-[#0b0b0d] hover:bg-[#ef675d]">Validate package</button><button type="button" onClick={saveDraft} disabled={!parseModuleForReview(raw)} title={!parseModuleForReview(raw) ? "Fix the JSON structure before saving" : "Save an in-progress local review draft"} className="rounded-xl border border-[#5d3936] px-4 py-3 text-sm font-semibold text-[#f5f5f2] enabled:hover:border-[#e34a3f] disabled:cursor-not-allowed disabled:opacity-40">Save local review draft</button><button type="button" onClick={() => downloadJson(raw, "kizashi-content-draft.json")} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-[#9297a1] hover:text-[#f5f5f2]">Export JSON</button>{!parsedDraft.result.valid ? <span className="text-xs text-[#ef675d]">Saved drafts may be incomplete; validate before publishing.</span> : null}{message ? <span className="text-xs text-[#e5b85c]" role="status">{message}</span> : null}</div>
    </section>

    {showContentIssues ? <Issues result={result} /> : <section className="rounded-xl border border-[#3f4652] bg-[#101b2b]/70 p-5"><p className="eyebrow">Draft editing</p><p className="mt-2 text-sm leading-6 text-[#c3c7ce]">Review cards are for scanning. Use Edit records for normal changes; Advanced JSON is for imports and bulk edits.</p></section>}

    <section className="rounded-xl border border-[#3f3427] bg-[#211d18]/65 p-5 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Question set</p><h2 className="mt-1 text-xl font-medium text-[#f5f5f2]">Review drills at a glance.</h2><p className="mt-1 max-w-2xl text-sm text-[#9297a1]">Generated drafts appear here for approval. Approved questions stay in the active pipeline.</p></div><button type="button" onClick={resetQuestions} className="w-fit rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-[#c3c7ce] hover:border-[#e5b85c] hover:text-[#f1cf7c]">Reset questions</button></div><div className="mt-5 flex gap-2 border-b border-white/10 pb-3"><button type="button" onClick={() => setQuestionView("review")} className={`rounded-lg px-3 py-2 text-xs ${questionView === "review" ? "bg-[#e5b85c] text-[#0b0b0d]" : "border border-[#3f4652] text-[#9297a1]"}`}>Review questions</button><button type="button" onClick={() => setQuestionView("edit")} className={`rounded-lg px-3 py-2 text-xs ${questionView === "edit" ? "bg-[#3a2023] text-[#f5f5f2]" : "border border-[#3f4652] text-[#9297a1]"}`}>Advanced JSON</button></div>{questionView === "edit" ? <textarea value={questionRaw} onChange={(event) => setQuestionRaw(event.target.value)} spellCheck={false} aria-label="Question set JSON" className="mt-5 min-h-[24rem] w-full rounded-xl border border-[#3f4652] bg-[#0d1522]/90 p-4 font-mono text-xs leading-6 text-[#d8dde4] outline-none focus:border-[#e5b85c]" /> : <div className="mt-5"><QuestionReview raw={questionRaw} fallback={questions} onReview={updateQuestionStatus} onEdit={() => setQuestionView("edit")} /></div>}<div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" onClick={validateQuestions} className="rounded-xl bg-[#e34a3f] px-4 py-3 text-sm font-semibold text-[#0b0b0d] hover:bg-[#ef675d]">Validate questions</button><button type="button" onClick={saveQuestionDraft} disabled={!questionResult.valid} title={!questionResult.valid ? "Fix question errors before saving" : undefined} className="rounded-xl border border-[#3f4652] px-4 py-3 text-sm font-semibold text-[#f5f5f2] enabled:hover:border-[#e34a3f] disabled:cursor-not-allowed disabled:opacity-40">Save question draft</button><button type="button" onClick={() => downloadJson(questionRaw, "kizashi-question-draft.json")} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-[#9297a1] hover:text-[#f5f5f2]">Export questions</button>{!questionResult.valid ? <span className="text-xs text-[#ef675d]">Fix question errors, then validate to unlock saving.</span> : null}</div></section>
    <Issues result={questionResult} />
  </div>;
}
