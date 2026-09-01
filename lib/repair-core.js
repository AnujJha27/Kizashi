const DAY_MS = 86400000;

export function buildRepairPlan(question, now = Date.now()) {
  return {
    id: `repair-${question.id}`,
    itemId: question.itemId,
    questionId: question.id,
    ...(question.contextSetId ? { contextSetId: question.contextSetId } : {}),
    targetItemIds: [...new Set([question.itemId, ...(question.targetItemIds ?? [])])],
    followUpDueAt: Number(now) + DAY_MS,
    status: "started",
  };
}

export function getDueRepairs(repairs = [], now = Date.now()) {
  return repairs.filter((repair) => repair?.status === "started" && Number(repair.followUpDueAt) <= Number(now));
}
