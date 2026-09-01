export function preservePracticePosition(previousQuestionIds, previousPosition, nextQuestionIds) {
  const currentQuestionId = previousQuestionIds[previousPosition];
  const preservedPosition = currentQuestionId ? nextQuestionIds.indexOf(currentQuestionId) : -1;
  if (preservedPosition >= 0) return preservedPosition;
  return Math.min(Math.max(previousPosition, 0), Math.max(nextQuestionIds.length - 1, 0));
}
