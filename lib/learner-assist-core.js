const tasks = new Set(["explain", "conversation", "writing"]);
const MAX_TEXT_LENGTH = 2000;
const MAX_RESPONSE_LENGTH = 3000;

function record(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value, max = MAX_RESPONSE_LENGTH) {
  return typeof value === "string" && value.trim().length <= max ? value.trim() : "";
}

function strings(value, maxItems = 12) {
  return Array.isArray(value) && value.length <= maxItems && value.every((entry) => text(entry)) ? value.map((entry) => entry.trim()) : [];
}

export function validateLearnerAssistRequest(body, knownItemIds = new Set()) {
  if (!record(body) || !tasks.has(body.task)) return { status: 400, error: "Choose explain, conversation, or writing." };
  const value = typeof body.text === "string" ? body.text.trim() : "";
  if (!value) return { status: 400, error: "Add Japanese text first." };
  if (value.length > MAX_TEXT_LENGTH) return { status: 400, error: "Text is limited to 2,000 characters." };
  const itemId = body.itemId === undefined ? undefined : text(body.itemId, 120);
  if (body.itemId !== undefined && (!itemId || !knownItemIds.has(itemId))) return { status: 404, error: "That curriculum item is not available." };
  return { status: 200, task: body.task, text: value, ...(itemId ? { itemId } : {}) };
}

export function parseLearnerAssistResponse(task, value) {
  let parsed = value;
  if (typeof value === "string") {
    const unfenced = value.replace(/^```(?:json)?\s*/iu, "").replace(/\s*```$/u, "").trim();
    try {
      parsed = JSON.parse(unfenced);
    } catch {
      return null;
    }
  }
  if (!record(parsed)) return null;
  if (task === "explain") {
    const segmentation = strings(parsed.segmentation);
    const grammar = strings(parsed.grammar);
    const literalTranslation = text(parsed.literalTranslation);
    const naturalTranslation = text(parsed.naturalTranslation);
    return segmentation.length && grammar.length && literalTranslation && naturalTranslation ? { segmentation, grammar, literalTranslation, naturalTranslation } : null;
  }
  if (task === "conversation") {
    const reply = text(parsed.reply);
    const translation = text(parsed.translation);
    const question = text(parsed.question);
    const tip = text(parsed.tip);
    return reply && translation && question && tip ? { reply, translation, question, tip } : null;
  }
  const corrected = text(parsed.corrected);
  const explanation = text(parsed.explanation);
  const alternatives = parsed.alternatives === undefined ? [] : strings(parsed.alternatives, 3);
  return corrected && explanation && (parsed.alternatives === undefined || alternatives.length) ? { corrected, explanation, alternatives } : null;
}

export { MAX_TEXT_LENGTH };
