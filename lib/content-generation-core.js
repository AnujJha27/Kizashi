const questionTypes = [
  "meaning",
  "contextual vocabulary",
  "paraphrase",
  "orthography",
  "kana recall",
  "Japanese recall",
  "kanji reading",
  "kanji meaning",
  "reading in context",
  "word to kanji recall",
  "grammar in context",
  "sentence completion",
  "sentence ordering",
  "short passage detail",
  "information retrieval",
  "task-based response",
  "key point",
  "verbal expression",
  "quick response",
];

export const generationQuestionTypes = new Set(questionTypes);

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function error(status, message) {
  return { status, error: message };
}

export function validateGenerationRequest({ authenticated, admin, apiKey, now, lastGeneratedAt, body, knownItemIds }) {
  if (!authenticated) return error(401, "Authentication required.");
  if (!admin) return error(403, "Administrator access required.");
  if (!apiKey) return error(503, "OPENROUTER_API_KEY is not configured.");
  if (now - lastGeneratedAt < 3000) return error(429, "Please wait a moment before generating another draft.");
  if (!isRecord(body) || typeof body.itemId !== "string" || !body.itemId.trim() || body.itemId.length > 120 || typeof body.questionType !== "string" || !generationQuestionTypes.has(body.questionType)) return error(400, "Choose a known curriculum item and question type.");
  if (!knownItemIds.has(body.itemId)) return error(404, "That curriculum item is not available.");
  return { status: 200, itemId: body.itemId, questionType: body.questionType };
}

export function generatedReview(model, targetItemId, generatedAt = new Date().toISOString()) {
  return {
    status: "draft",
    generatedBy: `openrouter:${model}`,
    model,
    generatedAt,
    targetItemIds: [targetItemId],
    validationIssues: [],
    reviewNotes: "",
  };
}
