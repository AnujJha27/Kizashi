import { normalizeAnswer } from "./mastery.js";

const modes = Object.freeze(["word", "phrase", "sentence", "dialogue-gap", "key-information"]);

function firstLine(transcript) {
  return String(transcript ?? "").split(/\r?\n/u).map((line) => line.replace(/^[A-ZＡ-Ｚ]：/u, "").trim()).find(Boolean) ?? "";
}

function keyAnswer(clip) {
  const question = clip.questions?.find((entry) => Array.isArray(entry.answers) && Number.isInteger(entry.correctAnswer));
  return question?.answers?.[question.correctAnswer] ?? firstLine(clip.transcript);
}

function modeFor(level, index) {
  if (level === "N5") return index < 15 ? "word" : index < 30 ? "phrase" : index < 60 ? "sentence" : index < 68 ? "dialogue-gap" : "key-information";
  return index < 25 ? "phrase" : index < 60 ? "sentence" : index < 70 ? "dialogue-gap" : "key-information";
}

function answerFor(clip, mode) {
  if (mode === "word") return String(clip.title ?? "").split("·")[0].trim() || firstLine(clip.transcript);
  if (mode === "phrase" || mode === "sentence") return firstLine(clip.transcript);
  return keyAnswer(clip);
}

export function buildDictationBank(clips = []) {
  return ["N5", "N4"].flatMap((level) => clips.filter((clip) => clip.jlptLevel === level).slice(0, level === "N5" ? 75 : 80).map((clip, index) => {
    const mode = modeFor(level, index);
    const answer = answerFor(clip, mode);
    return { id: `${clip.id}-dictation-${mode}`, clipId: clip.id, title: clip.title, situation: clip.situation, level, mode, prompt: mode === "dialogue-gap" ? "Listen, then type the missing response." : mode === "key-information" ? "Listen, then reconstruct the key information." : mode === "word" ? "Type the word you hear." : mode === "phrase" ? "Type the short phrase you hear." : "Type the sentence you hear.", answer, audioText: mode === "word" || mode === "phrase" || mode === "sentence" ? answer : clip.transcript, audioUrl: clip.audioUrl, audio: clip.audio };
  }));
}

export function normalizeDictationAnswer(value, { orthographySensitive = false } = {}) {
  const normalized = normalizeAnswer(value, orthographySensitive ? "strict" : "kana");
  return orthographySensitive ? normalized : normalized.replace(/[。、，！？!?.,]/gu, "");
}

export function dictationMatches(answer, expected, options) {
  return normalizeDictationAnswer(answer, options) === normalizeDictationAnswer(expected, options);
}

export function getDictationDifference(answer, expected) {
  const actual = String(answer ?? "");
  const target = String(expected ?? "");
  let start = 0;
  while (start < actual.length && start < target.length && actual[start] === target[start]) start += 1;
  let actualEnd = actual.length;
  let targetEnd = target.length;
  while (actualEnd > start && targetEnd > start && actual[actualEnd - 1] === target[targetEnd - 1]) { actualEnd -= 1; targetEnd -= 1; }
  return { prefix: target.slice(0, start), answer: actual.slice(start, actualEnd), expected: target.slice(start, targetEnd), suffix: target.slice(targetEnd) };
}

export { modes as dictationModes };
