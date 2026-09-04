const LEVELS = ["N5", "N4"];
const PRAGMATIC_FUNCTIONS = [
  ["soft refusal", /ちょっと|declin|difficult|cannot|\bno\b/iu],
  ["invitation", /invite|invitation|一緒に|ませんか|ましょう/iu],
  ["request", /request|please|お願い|ください|\bask\b/iu],
  ["apology", /apolog|sorry|すみません/iu],
  ["thanks", /thank|ありがとう/iu],
  ["permission", /permission|\bmay\b|いいですか/iu],
  ["agreement", /agree|\byes\b|そうです|いいですね/iu],
  ["offering", /offer|どうぞ/iu],
  ["repetition", /repeat|もう一度|聞こえ/iu],
];

export function outputReviewId(activityId) {
  return `output:${activityId}`;
}

export function outputReviewRating(rating) {
  return { again: "again", close: "hard", "got-it": "good" }[rating] ?? "good";
}

function sourceEvidence(item) {
  return item.sourceIds?.length ? item.sourceIds : ["michi-authored-content"];
}

function firstSentences(text, count = 2) {
  return String(text ?? "").split(/(?<=[。！？])/u).filter(Boolean).slice(0, count).join("") || String(text ?? "");
}

function promptFor(kind, item) {
  if (kind === "speaking") return `Respond to this situation in Japanese: ${item.situation ?? item.title}`;
  return `Write a short Japanese response about: ${item.title ?? item.subcategory ?? "this situation"}`;
}

function pragmaticFunction(item, question) {
  const text = [item.title, item.situation, item.transcript, question.prompt, question.questionType, ...(item.tags ?? [])].join(" ");
  return PRAGMATIC_FUNCTIONS.find(([, pattern]) => pattern.test(text))?.[0] ?? null;
}

function surfaceGrammar(collocation) {
  // ponytail: cheap surface-particle signal; replace with reviewed grammar links when chunk mapping is curated.
  const particles = ["は", "が", "を", "に", "で", "へ", "と", "の", "から", "まで", "も", "や"];
  return particles.filter((particle) => collocation.includes(particle)).map((particle) => `particle:${particle}`);
}

export function buildChunkBank(vocabulary = []) {
  const chunks = new Map();
  vocabulary.forEach((item) => {
    (item.collocations ?? []).map((value) => String(value).trim()).filter(Boolean).forEach((collocation) => {
      const existing = chunks.get(collocation);
      if (existing) {
        existing.headVocabularyIds = [...new Set([...existing.headVocabularyIds, item.id])];
        existing.sourceEvidence = [...new Set([...existing.sourceEvidence, ...sourceEvidence(item)])];
        return;
      }
      chunks.set(collocation, {
        id: `chunk-${chunks.size + 1}`,
        phrase: collocation,
        targetLevel: item.jlptLevel,
        headVocabularyIds: [item.id],
        grammarUsed: surfaceGrammar(collocation),
        spokenWrittenRelevance: item.tags?.some((tag) => /conversation|spoken|speaking/iu.test(tag)) ? "spoken" : "spoken and written",
        frequencyEvidence: { commonness: item.commonness ?? null, frequency: item.frequency ?? null, spokenFrequency: item.spokenFrequency ?? null },
        sourceEvidence: sourceEvidence(item),
      });
    });
  });
  return [...chunks.values()];
}

function buildSpeaking(listening) {
  return LEVELS.flatMap((level) => listening.filter((item) => item.jlptLevel === level).slice(0, 40).map((item) => ({
    id: `speaking-${item.id}`,
    kind: "speaking",
    level,
    title: item.title,
    japanese: item.transcript,
    prompt: promptFor("speaking", item),
    model: item.transcript,
    reading: item.transcript,
    hint: "Say your response aloud first, then compare with the model dialogue.",
    sourceEvidence: sourceEvidence(item),
  })));
}

function buildWriting(readings) {
  const counts = { N5: 25, N4: 35 };
  return LEVELS.flatMap((level) => readings.filter((item) => item.jlptLevel === level).slice(0, counts[level]).map((item) => ({
    id: `writing-${item.id}`,
    kind: "writing",
    level,
    title: item.title,
    japanese: item.passage,
    prompt: promptFor("writing", item),
    model: firstSentences(item.passage),
    reading: firstSentences(item.passage),
    hint: "Write one or two sentences first. Compare structure and target forms; other natural answers may also be correct.",
    target: [...(item.grammarIds ?? []).slice(0, 2), ...(item.vocabularyIds ?? []).slice(0, 2)],
    sourceEvidence: sourceEvidence(item),
  })));
}

function buildPragmatics(listening) {
  const functionChoices = PRAGMATIC_FUNCTIONS.map(([name]) => name);
  return LEVELS.flatMap((level) => listening.filter((item) => item.jlptLevel === level).flatMap((item) => (item.questions ?? []).map((question, index) => {
    const functionName = pragmaticFunction(item, question);
    if (!functionName) return null;
    const choices = [functionName, ...functionChoices.filter((name) => name !== functionName).slice(0, 2)];
    return {
      id: `pragmatics-${item.id}-${index + 1}`,
      kind: "pragmatics",
      level,
      title: item.title,
      function: functionName,
      japanese: item.transcript,
      prompt: `What is the speaker trying to do here? Focus on the communicative function: ${functionName}.`,
      model: `Communicative function: ${functionName}.`,
      reading: item.transcript,
      hint: "Interpret the whole situation. The same expression can do different work in different contexts.",
      choices,
      answer: 0,
      sourceEvidence: sourceEvidence(item),
    };
  }).filter(Boolean)));
}

export function buildOutputBanks(module = {}) {
  return {
    speaking: buildSpeaking(module.listening ?? []),
    writing: buildWriting(module.readings ?? []),
    pragmatics: buildPragmatics(module.listening ?? []),
    chunks: buildChunkBank(module.vocabulary ?? []),
  };
}
