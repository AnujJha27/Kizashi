const DAY_MS = 86400000;

function answerFor(question) {
  if (question.answerMode === "text") return question.acceptedAnswers?.join(" / ") || "Review the accepted form.";
  if (question.questionType === "sentence ordering" && question.tokens && question.correctOrder) return question.correctOrder.map((index) => question.tokens[index]).join(" ");
  return question.options?.[question.correctIndex] ?? "Review the highlighted answer.";
}

export function buildRepairCard(question, item, contrast) {
  const sourceIds = [...new Set(item?.sourceIds ?? [])];
  const sourceBoundary = sourceIds.some((sourceId) => /(?:tadoku|cejc|csj|ijas)/iu.test(sourceId));
  const safeItem = sourceBoundary ? undefined : item;
  const example = safeItem?.category === "vocabulary" ? safeItem.exampleSentences?.[0] : safeItem?.category === "grammar" ? safeItem.examples?.[0] : undefined;
  return {
    explanation: safeItem?.category === "grammar" ? [safeItem.meaning, safeItem.intuition].filter(Boolean).join(" ") : safeItem?.category === "vocabulary" ? safeItem.meanings?.join(" · ") : question.explanation,
    contrast: sourceBoundary ? "Review the original Kizashi explanation and compare the surrounding context before choosing." : contrast?.explanation || safeItem?.commonMistakes?.[0] || "Compare the meaning and surrounding context before choosing.",
    example: example?.japanese || question.contextText || question.prompt,
    ...(example?.translation ? { exampleTranslation: example.translation } : {}),
    answer: answerFor(question),
    followUp: question.contextText ? `Use the concept again in this context: ${question.contextText}` : question.prompt,
    sourceIds,
  };
}

export function buildRepairPlan(question, now = Date.now(), context = {}) {
  const card = buildRepairCard(question, context.item, context.contrast);
  return {
    id: `repair-${question.id}`,
    itemId: question.itemId,
    questionId: question.id,
    ...(question.contextSetId ? { contextSetId: question.contextSetId } : {}),
    targetItemIds: [...new Set([question.itemId, ...(question.targetItemIds ?? [])])],
    followUpDueAt: Number(now) + DAY_MS,
    status: "started",
    followUpStatus: "pending",
    card,
  };
}

export function getDueRepairs(repairs = [], now = Date.now()) {
  return repairs.filter((repair) => ["started", "completed"].includes(repair?.status) && (repair?.followUpStatus ?? "pending") === "pending" && Number(repair.followUpDueAt) <= Number(now));
}
