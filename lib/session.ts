import { mergeSyncSnapshots } from "@/lib/supabase/sync-core.js";
import type { AnswerConfidence, CurrentLessonState, QuestionStats } from "@/lib/types";

export type { QuestionStats } from "@/lib/types";

export const CURRENT_LESSON_STORAGE_KEY = "michi.current-lesson";
export const REVIEW_STORAGE_KEY = "michi.review-records";
export const NOTES_STORAGE_KEY = "michi.notes";
export const MISTAKES_STORAGE_KEY = "michi.mistakes";
export const DIAGNOSTIC_STORAGE_KEY = "michi.diagnostic-results";
export const QUESTION_STATS_STORAGE_KEY = "michi.question-stats";
export const STUDY_STATS_STORAGE_KEY = "michi.study-stats";
export const SAVED_SENTENCES_STORAGE_KEY = "michi.saved-sentences";
export const STUDY_LATER_STORAGE_KEY = "michi.study-later";
export const PRACTICE_SESSION_STORAGE_KEY = "michi.practice-session";
export const PROFILE_PREFERENCES_STORAGE_KEY = "michi.profile-preferences";
export const EXAM_ATTEMPTS_STORAGE_KEY = "michi.exam-attempts";
export const CUSTOM_ENTRIES_STORAGE_KEY = "michi.custom-entries";
export const SYNC_ENABLED_STORAGE_KEY = "michi.sync-enabled";

const BACKUP_KEYS = [CURRENT_LESSON_STORAGE_KEY, REVIEW_STORAGE_KEY, NOTES_STORAGE_KEY, MISTAKES_STORAGE_KEY, DIAGNOSTIC_STORAGE_KEY, QUESTION_STATS_STORAGE_KEY, STUDY_STATS_STORAGE_KEY, SAVED_SENTENCES_STORAGE_KEY, STUDY_LATER_STORAGE_KEY, PROFILE_PREFERENCES_STORAGE_KEY, EXAM_ATTEMPTS_STORAGE_KEY, CUSTOM_ENTRIES_STORAGE_KEY, "michi.content-draft", "michi.question-draft"] as const;

function isBackupKey(key: string) {
  return BACKUP_KEYS.includes(key as (typeof BACKUP_KEYS)[number]) || key.startsWith(`${PRACTICE_SESSION_STORAGE_KEY}.`);
}

export function createLocalBackup() {
  if (typeof window === "undefined") return "";
  const data: Record<string, string> = {};
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key && isBackupKey(key)) {
      const value = window.localStorage.getItem(key);
      if (value !== null) data[key] = value;
    }
  }
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data }, null, 2);
}

function storedJson(key: string) {
  if (typeof window === "undefined") return undefined;
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? undefined : JSON.parse(value);
  } catch {
    return undefined;
  }
}

export function createLocalSyncSnapshot() {
  if (typeof window === "undefined") return { version: 1 as const, data: {} };
  const data: Record<string, unknown> = {};
  const directKeys: Record<string, string> = {
    [REVIEW_STORAGE_KEY]: "reviewRecords",
    [MISTAKES_STORAGE_KEY]: "mistakes",
    [NOTES_STORAGE_KEY]: "notes",
    [QUESTION_STATS_STORAGE_KEY]: "questionStats",
    [STUDY_STATS_STORAGE_KEY]: "studyStats",
    [PROFILE_PREFERENCES_STORAGE_KEY]: "profilePreferences",
    [DIAGNOSTIC_STORAGE_KEY]: "diagnosticResult",
    [SAVED_SENTENCES_STORAGE_KEY]: "savedSentences",
    [STUDY_LATER_STORAGE_KEY]: "studyLaterIds",
    [EXAM_ATTEMPTS_STORAGE_KEY]: "examAttempts",
  };
  Object.entries(directKeys).forEach(([storageKey, syncKey]) => {
    const value = storedJson(storageKey);
    if (value !== undefined) data[syncKey] = value;
  });
  const practiceSessions: Record<string, unknown> = {};
  const lessonStates: Record<string, unknown> = {};
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key) continue;
    if (key.startsWith(`${PRACTICE_SESSION_STORAGE_KEY}.`)) practiceSessions[key.slice(PRACTICE_SESSION_STORAGE_KEY.length + 1)] = storedJson(key);
    if (key.startsWith(`${CURRENT_LESSON_STORAGE_KEY}.`)) lessonStates[key.slice(CURRENT_LESSON_STORAGE_KEY.length + 1)] = storedJson(key);
  }
  if (Object.keys(practiceSessions).length) data.practiceSessions = practiceSessions;
  if (Object.keys(lessonStates).length) data.lessonStates = lessonStates;
  return { version: 1 as const, data };
}

export function applyLocalSyncSnapshot(snapshot: unknown) {
  if (typeof window === "undefined" || typeof snapshot !== "object" || snapshot === null || Array.isArray(snapshot)) return 0;
  const data = (snapshot as { version?: unknown; data?: unknown }).data;
  if ((snapshot as { version?: unknown }).version !== 1 || typeof data !== "object" || data === null || Array.isArray(data)) return 0;
  const values = mergeSyncSnapshots(createLocalSyncSnapshot(), snapshot).data;
  const storageKeys: Record<string, string> = {
    reviewRecords: REVIEW_STORAGE_KEY,
    mistakes: MISTAKES_STORAGE_KEY,
    notes: NOTES_STORAGE_KEY,
    questionStats: QUESTION_STATS_STORAGE_KEY,
    studyStats: STUDY_STATS_STORAGE_KEY,
    profilePreferences: PROFILE_PREFERENCES_STORAGE_KEY,
    diagnosticResult: DIAGNOSTIC_STORAGE_KEY,
    savedSentences: SAVED_SENTENCES_STORAGE_KEY,
    studyLaterIds: STUDY_LATER_STORAGE_KEY,
    examAttempts: EXAM_ATTEMPTS_STORAGE_KEY,
  };
  let restored = 0;
  Object.entries(storageKeys).forEach(([syncKey, storageKey]) => {
    if (values[syncKey] === undefined) return;
    window.localStorage.setItem(storageKey, JSON.stringify(values[syncKey]));
    restored += 1;
  });
  if (typeof values.practiceSessions === "object" && values.practiceSessions !== null && !Array.isArray(values.practiceSessions)) Object.entries(values.practiceSessions as Record<string, unknown>).forEach(([id, value]) => { window.localStorage.setItem(`${PRACTICE_SESSION_STORAGE_KEY}.${id}`, JSON.stringify(value)); restored += 1; });
  if (typeof values.lessonStates === "object" && values.lessonStates !== null && !Array.isArray(values.lessonStates)) Object.entries(values.lessonStates as Record<string, unknown>).forEach(([id, value]) => { window.localStorage.setItem(`${CURRENT_LESSON_STORAGE_KEY}.${id}`, JSON.stringify(value)); restored += 1; });
  ["michi-profile-updated", "michi-review-updated", "michi-study-stats-updated", "michi-question-stats-updated", "michi-lesson-updated"].forEach((eventName) => window.dispatchEvent(new Event(eventName)));
  return restored;
}

export function readSyncEnabled() {
  return typeof window !== "undefined" && window.localStorage.getItem(SYNC_ENABLED_STORAGE_KEY) === "true";
}

export function writeSyncEnabled(enabled: boolean) {
  if (typeof window !== "undefined") window.localStorage.setItem(SYNC_ENABLED_STORAGE_KEY, String(enabled));
}

export function restoreLocalBackup(raw: string) {
  if (typeof window === "undefined") return 0;
  const backup = JSON.parse(raw) as { version?: unknown; data?: unknown };
  if (backup.version !== 1 || typeof backup.data !== "object" || backup.data === null || Array.isArray(backup.data)) throw new Error("This is not a Kizashi backup file.");
  let restored = 0;
  Object.entries(backup.data as Record<string, unknown>).forEach(([key, value]) => {
    if (!isBackupKey(key) || typeof value !== "string") return;
    window.localStorage.setItem(key, value);
    restored += 1;
  });
  ["michi-profile-updated", "michi-review-updated", "michi-study-stats-updated", "michi-question-stats-updated", "michi-content-draft-updated", "michi-question-draft-updated", "michi-custom-entries-updated"].forEach((eventName) => window.dispatchEvent(new Event(eventName)));
  return restored;
}

export type ReviewRating = "again" | "hard" | "good" | "easy";
export type MasterySignal = "recognition" | "recall" | "context";
export type MasteryState = "unseen" | "introduced" | "learning" | "stable" | "strong";
export type FuriganaMode = "always" | "unknown" | "tap" | "hide";

export interface ReviewRecord {
  itemId: string;
  attempts: number;
  correct: number;
  streak: number;
  dueAt: number;
  lastReviewedAt: number;
  exposureCount?: number;
  recognitionStrength?: number;
  recallStrength?: number;
  contextStrength?: number;
  stability?: number;
  difficulty?: number;
  incorrectCount?: number;
  masteryState?: MasteryState;
}

export interface NoteRecord {
  itemId: string;
  body: string;
  updatedAt: number;
}

export interface MistakeRecord {
  itemId: string;
  count: number;
  lastSeenAt: number;
  lastQuestionType?: string;
  questionTypes?: Record<string, number>;
}

export interface DiagnosticResult {
  level: "N5" | "N4";
  correct: number;
  total: number;
  categoryBreakdown: Record<string, { correct: number; total: number }>;
  completedAt: number;
}

export interface StudyStats {
  xp: number;
  activeDates: string[];
  bestRhythm: number;
  minutesByDate?: Record<string, number>;
}

export interface ExamAttempt {
  attemptId: string;
  level: "N5";
  section: "sampler" | "diagnostic" | "mini" | "section" | "full";
  questionsAttempted: number;
  correct: number;
  duration: number;
  categoryBreakdown: Record<string, { correct: number; total: number }>;
  weakTopics: string[];
  completedAt: number;
}

export interface SavedSentence {
  id: string;
  sourceItemId: string;
  japanese: string;
  translation: string;
  savedAt: number;
}

export interface CustomEntry {
  id: string;
  writtenForm: string;
  reading: string;
  meaning: string;
  sentence: string;
}

export interface PracticeSessionState {
  sessionId: string;
  questionIds: string[];
  startedAt?: number;
  position: number;
  selected: number | null;
  typedAnswer?: string;
  order?: number[];
  submitted: boolean;
  score: number;
  answerResults: Record<string, boolean>;
  confidence: AnswerConfidence | null;
}

export const defaultLessonState: CurrentLessonState = {
  lessonId: "lesson-meeting-people",
  position: 0,
  status: "in_progress",
};

function lessonStorageKey(lessonId: string) {
  return `${CURRENT_LESSON_STORAGE_KEY}.${lessonId}`;
}

export function readLessonState(lessonId = defaultLessonState.lessonId): CurrentLessonState {
  const initialState = { ...defaultLessonState, lessonId };
  if (typeof window === "undefined") return initialState;
  try {
    const value = window.localStorage.getItem(lessonStorageKey(lessonId)) ?? (lessonId === defaultLessonState.lessonId ? window.localStorage.getItem(CURRENT_LESSON_STORAGE_KEY) : null);
    return value ? { ...initialState, ...JSON.parse(value), lessonId } : initialState;
  } catch {
    return initialState;
  }
}

export function writeLessonState(state: CurrentLessonState) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(lessonStorageKey(state.lessonId), JSON.stringify(state));
    window.dispatchEvent(new Event("michi-lesson-updated"));
  }
}

export function readReviewRecords(): Record<string, ReviewRecord> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(REVIEW_STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function updateStrength(value: number, success: boolean, amount: number) {
  return Math.max(0, Math.min(1, value + (success ? amount : -amount * 1.25)));
}

function masteryState(exposureCount: number, recognition: number, recall: number, context: number, streak: number): MasteryState {
  if (!exposureCount) return "unseen";
  if (exposureCount === 1) return "introduced";
  const average = (recognition + recall + context) / 3;
  if (average >= 0.78 && streak >= 2) return "strong";
  if (average >= 0.5) return "stable";
  return "learning";
}

export function recordReview(itemId: string, rating: ReviewRating, signal: MasterySignal = "recall", questionType?: string, activityMinutes = 1) {
  if (typeof window === "undefined") return;
  if (rating === "again") recordMistake(itemId, questionType);
  const records = readReviewRecords();
  const previous = records[itemId] ?? { itemId, attempts: 0, correct: 0, streak: 0, dueAt: 0, lastReviewedAt: 0 };
  const now = Date.now();
  const success = rating !== "again";
  const streak = success ? previous.streak + 1 : 0;
  const amount = rating === "easy" ? 0.22 : rating === "good" ? 0.16 : rating === "hard" ? 0.08 : 0.14;
  const recognition = updateStrength(previous.recognitionStrength ?? 0, success, amount * (signal === "recognition" ? 1 : 0.45));
  const recall = updateStrength(previous.recallStrength ?? 0, success, amount * (signal === "recall" ? 1 : 0.45));
  const context = updateStrength(previous.contextStrength ?? 0, success, amount * (signal === "context" ? 1 : 0.45));
  const exposureCount = (previous.exposureCount ?? previous.attempts) + 1;
  const dayDelay = rating === "again" ? 0 : rating === "hard" ? 1 : rating === "easy" ? Math.min(30, 3 * 2 ** Math.min(streak, 4)) : Math.min(14, 2 ** Math.min(streak, 4));
  const delay = rating === "again" ? 10 * 60 * 1000 : dayDelay * 24 * 60 * 60 * 1000;
  records[itemId] = {
    itemId,
    attempts: previous.attempts + 1,
    correct: previous.correct + (success ? 1 : 0),
    streak,
    dueAt: now + delay,
    lastReviewedAt: now,
    exposureCount,
    recognitionStrength: recognition,
    recallStrength: recall,
    contextStrength: context,
    stability: Math.max(0, (previous.stability ?? 0) + (success ? amount * 10 : -2)),
    difficulty: Math.max(0, Math.min(1, (previous.difficulty ?? 0.5) + (success ? -0.02 : 0.05))),
    incorrectCount: (previous.incorrectCount ?? previous.attempts - previous.correct) + (success ? 0 : 1),
    masteryState: masteryState(exposureCount, recognition, recall, context, streak),
  };
  window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(records));
  recordStudyActivity(success ? 2 : 1, activityMinutes);
  window.dispatchEvent(new Event("michi-review-updated"));
}

export function getDueReviewIds(now = Date.now()) {
  return Object.values(readReviewRecords()).filter((record) => record.dueAt <= now).map((record) => record.itemId);
}

export function readNotes(): Record<string, NoteRecord> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(NOTES_STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function readNote(itemId: string) {
  return readNotes()[itemId]?.body ?? "";
}

export function writeNote(itemId: string, body: string) {
  if (typeof window === "undefined") return;
  const notes = readNotes();
  if (body.trim()) notes[itemId] = { itemId, body: body.trim(), updatedAt: Date.now() };
  else delete notes[itemId];
  window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}

export function readMistakes(): Record<string, MistakeRecord> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(MISTAKES_STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function recordMistake(itemId: string, questionType?: string) {
  if (typeof window === "undefined") return;
  const mistakes = readMistakes();
  const previous = mistakes[itemId];
  const questionTypes = { ...(previous?.questionTypes ?? {}) };
  if (questionType) questionTypes[questionType] = (questionTypes[questionType] ?? 0) + 1;
  mistakes[itemId] = { itemId, count: (previous?.count ?? 0) + 1, lastSeenAt: Date.now(), lastQuestionType: questionType ?? previous?.lastQuestionType, questionTypes };
  window.localStorage.setItem(MISTAKES_STORAGE_KEY, JSON.stringify(mistakes));
}

export function readDiagnosticResult() {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(DIAGNOSTIC_STORAGE_KEY);
    return value ? (JSON.parse(value) as DiagnosticResult) : null;
  } catch {
    return null;
  }
}

export function writeDiagnosticResult(result: DiagnosticResult) {
  if (typeof window !== "undefined") window.localStorage.setItem(DIAGNOSTIC_STORAGE_KEY, JSON.stringify(result));
}

export function readExamAttempts(): ExamAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(EXAM_ATTEMPTS_STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value as ExamAttempt[] : [];
  } catch {
    return [];
  }
}

export function recordExamAttempt(attempt: ExamAttempt) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(EXAM_ATTEMPTS_STORAGE_KEY, JSON.stringify([attempt, ...readExamAttempts()].slice(0, 30)));
  window.dispatchEvent(new Event("michi-exam-attempt-updated"));
}

export function readQuestionStats(): Record<string, QuestionStats> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(QUESTION_STATS_STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function recordQuestionAnswer(questionId: string, correct: boolean, responseMs: number | null = null, confidence: AnswerConfidence | null = null) {
  if (typeof window === "undefined") return;
  const stats = readQuestionStats();
  const previous = stats[questionId] ?? { questionId, attempts: 0, correct: 0, ambiguityReports: 0, qualityScore: 1, slowCount: 0 };
  const attempts = previous.attempts + 1;
  const accuracy = (previous.correct + (correct ? 1 : 0)) / attempts;
  stats[questionId] = { ...previous, attempts, correct: previous.correct + (correct ? 1 : 0), qualityScore: Math.max(0, Math.round((accuracy - (previous.ambiguityReports ?? 0) * 0.1) * 100) / 100), lastResponseMs: responseMs, lastConfidence: confidence, slowCount: (previous.slowCount ?? 0) + (responseMs !== null && responseMs >= 12000 ? 1 : 0) };
  window.localStorage.setItem(QUESTION_STATS_STORAGE_KEY, JSON.stringify(stats));
  window.dispatchEvent(new Event("michi-question-stats-updated"));
}

export function recordQuestionAmbiguity(questionId: string) {
  if (typeof window === "undefined") return;
  const stats = readQuestionStats();
  const previous = stats[questionId] ?? { questionId, attempts: 0, correct: 0, ambiguityReports: 0, qualityScore: 1, slowCount: 0 };
  stats[questionId] = { ...previous, ambiguityReports: previous.ambiguityReports + 1, qualityScore: Math.max(0, Math.round((previous.qualityScore - 0.1) * 100) / 100) };
  window.localStorage.setItem(QUESTION_STATS_STORAGE_KEY, JSON.stringify(stats));
  window.dispatchEvent(new Event("michi-question-stats-updated"));
}

export function readStudyStats(): StudyStats {
  if (typeof window === "undefined") return { xp: 0, activeDates: [], bestRhythm: 0 };
  try {
    return { xp: 0, activeDates: [], bestRhythm: 0, ...JSON.parse(window.localStorage.getItem(STUDY_STATS_STORAGE_KEY) ?? "{}") };
  } catch {
    return { xp: 0, activeDates: [], bestRhythm: 0 };
  }
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getCurrentRhythm(dates: string[], today = new Date()) {
  const active = new Set(dates);
  let count = 0;
  const cursor = new Date(today);
  while (active.has(localDateKey(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function getTodayStudyMinutes() {
  const stats = readStudyStats();
  return stats.minutesByDate?.[localDateKey(new Date())] ?? 0;
}

export function readDailyGoal() {
  if (typeof window === "undefined") return 10;
  try {
    const value = JSON.parse(window.localStorage.getItem(PROFILE_PREFERENCES_STORAGE_KEY) ?? "{}").dailyMinutes;
    return [5, 10, 20, 30].includes(Number(value)) ? Number(value) : 10;
  } catch {
    return 10;
  }
}

export function readDisplayName() {
  if (typeof window === "undefined") return "";
  try {
    const value = JSON.parse(window.localStorage.getItem(PROFILE_PREFERENCES_STORAGE_KEY) ?? "{}").displayName;
    return typeof value === "string" ? value.trim() : "";
  } catch {
    return "";
  }
}

export function readFuriganaMode(): FuriganaMode {
  if (typeof window === "undefined") return "always";
  try {
    const value = JSON.parse(window.localStorage.getItem(PROFILE_PREFERENCES_STORAGE_KEY) ?? "{}").furiganaMode;
    return ["always", "unknown", "tap", "hide"].includes(value) ? value : "always";
  } catch {
    return "always";
  }
}

export function readAutoPlayAudio() {
  if (typeof window === "undefined") return false;
  try {
    return JSON.parse(window.localStorage.getItem(PROFILE_PREFERENCES_STORAGE_KEY) ?? "{}").autoPlayAudio === true;
  } catch {
    return false;
  }
}

export function recordStudyActivity(xp = 1, minutes = 1) {
  if (typeof window === "undefined") return;
  const previous = readStudyStats();
  const today = localDateKey(new Date());
  const activeDates = [...new Set([...previous.activeDates, today])].sort().slice(-365);
  const currentRhythm = getCurrentRhythm(activeDates);
  const minutesByDate = { ...(previous.minutesByDate ?? {}), [today]: (previous.minutesByDate?.[today] ?? 0) + minutes };
  const stats = { xp: previous.xp + xp, activeDates, bestRhythm: Math.max(previous.bestRhythm, currentRhythm), minutesByDate };
  window.localStorage.setItem(STUDY_STATS_STORAGE_KEY, JSON.stringify(stats));
  window.dispatchEvent(new Event("michi-study-stats-updated"));
}

export function readSavedSentences(): SavedSentence[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(SAVED_SENTENCES_STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function toggleSavedSentence(sentence: Omit<SavedSentence, "savedAt">) {
  if (typeof window === "undefined") return false;
  const saved = readSavedSentences();
  const exists = saved.some((entry) => entry.id === sentence.id);
  const next = exists ? saved.filter((entry) => entry.id !== sentence.id) : [{ ...sentence, savedAt: Date.now() }, ...saved];
  window.localStorage.setItem(SAVED_SENTENCES_STORAGE_KEY, JSON.stringify(next));
  return !exists;
}

export function readStudyLaterIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(STUDY_LATER_STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function toggleStudyLater(itemId: string) {
  if (typeof window === "undefined") return false;
  const saved = readStudyLaterIds();
  const exists = saved.includes(itemId);
  const next = exists ? saved.filter((id) => id !== itemId) : [itemId, ...saved];
  window.localStorage.setItem(STUDY_LATER_STORAGE_KEY, JSON.stringify(next));
  return !exists;
}

function practiceSessionKey(sessionId: string) {
  return `${PRACTICE_SESSION_STORAGE_KEY}.${sessionId}`;
}

export function readPracticeSession(sessionId: string, questionIds: string[]): PracticeSessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(window.localStorage.getItem(practiceSessionKey(sessionId)) ?? "null") as PracticeSessionState | null;
    return value && value.questionIds.join("|") === questionIds.join("|") ? value : null;
  } catch {
    return null;
  }
}

export function writePracticeSession(state: PracticeSessionState) {
  if (typeof window !== "undefined") window.localStorage.setItem(practiceSessionKey(state.sessionId), JSON.stringify(state));
}

export function clearPracticeSession(sessionId: string) {
  if (typeof window !== "undefined") window.localStorage.removeItem(practiceSessionKey(sessionId));
}

export function readCustomEntries(): CustomEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(CUSTOM_ENTRIES_STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((entry): entry is CustomEntry => Boolean(entry && typeof entry.id === "string" && typeof entry.writtenForm === "string" && typeof entry.reading === "string" && typeof entry.meaning === "string" && typeof entry.sentence === "string")) : [];
  } catch {
    return [];
  }
}

export function writeCustomEntry(entry: Omit<CustomEntry, "id">) {
  if (typeof window === "undefined") return [] as CustomEntry[];
  const next = [{ id: `${entry.writtenForm}-${Date.now()}`, ...entry }, ...readCustomEntries()];
  window.localStorage.setItem(CUSTOM_ENTRIES_STORAGE_KEY, JSON.stringify(next));
  return next;
}
