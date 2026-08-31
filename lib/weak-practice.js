import { ijasBoostForQuestion } from "./ijas-core.js";

function weaknessScore(question, records, mistakes, items, aggregates) {
  const record = records[question.itemId];
  const mistake = mistakes[question.itemId];
  const attempts = Number(record?.attempts ?? 0);
  const accuracy = attempts ? Number(record.correct ?? 0) / attempts : 1;
  const typeMisses = Number(mistake?.questionTypes?.[question.questionType] ?? 0);
  return typeMisses * 20 + Number(mistake?.count ?? 0) * 5 + (attempts && accuracy < 0.75 ? 10 : 0) + ijasBoostForQuestion(question, items, aggregates);
}

export function selectWeakPracticeQuestions(questions, records = {}, mistakes = {}, limit = 12, items = new Map(), aggregates = []) {
  const weakIds = new Set([
    ...Object.keys(mistakes),
    ...Object.values(records).filter((record) => record.attempts > 0 && record.correct / record.attempts < 0.75).map((record) => record.itemId),
  ]);
  return questions
    .filter((question) => weakIds.has(question.itemId))
    .sort((left, right) => weaknessScore(right, records, mistakes, items, aggregates) - weaknessScore(left, records, mistakes, items, aggregates) || left.id.localeCompare(right.id))
    .slice(0, Math.max(0, limit));
}
