import { normalizeAnswer } from "./mastery.js";

export const pronunciationProgressStages = Object.freeze(["not-introduced", "aware", "discriminates", "practised"]);

export function pronunciationProgressStage(value) {
  return pronunciationProgressStages.includes(value) ? value : "not-introduced";
}

export function advancePronunciationProgress(current, next) {
  const currentIndex = pronunciationProgressStages.indexOf(pronunciationProgressStage(current));
  const nextIndex = pronunciationProgressStages.indexOf(pronunciationProgressStage(next));
  return pronunciationProgressStages[Math.max(currentIndex, nextIndex)];
}

export function checkPronunciationAnswer(answer, expected) {
  return normalizeAnswer(answer, "kana") === normalizeAnswer(expected, "kana");
}
