const BLUEPRINTS = [
  {
    id: "integrated-restaurant",
    stimulusType: "dialogue",
    stimulus: "店員：いらっしゃいませ。\n客：ご飯を食べます。水もお願いします。\n店員：はい、わかりました。",
    estimatedMinutes: 3,
    questions: [
      { id: "integrated-restaurant-food", itemId: "vocab-gohan", category: "vocabulary", questionType: "integrated vocabulary", prompt: "お客さんは何を食べますか。", options: ["ご飯", "本", "電車", "傘"], correctIndex: 0, explanation: "お客さんはご飯を食べます。", targetItemIds: ["vocab-gohan"], testedSkills: ["vocabulary meaning"] },
      { id: "integrated-restaurant-request", itemId: "grammar-kudasai", category: "grammar", questionType: "polite request", prompt: "水を___。この文で、客の丁寧な依頼に合う形はどれですか。", options: ["ください", "あります", "でした", "行きます"], correctIndex: 0, explanation: "ください makes the request polite: 水をください。", targetItemIds: ["grammar-kudasai", "vocab-mizu"], testedSkills: ["polite request", "particle choice"] },
      { id: "integrated-restaurant-listening", itemId: "listening-cafe-order", category: "listening", questionType: "listening detail", prompt: "飲み物について、客は何をお願いしますか。", options: ["水", "お茶", "牛乳", "コーヒー"], correctIndex: 0, explanation: "客 says 水もお願いします。", targetItemIds: ["listening-cafe-order", "vocab-mizu"], testedSkills: ["listening detail"] },
      { id: "integrated-restaurant-next", itemId: "grammar-masu", category: "grammar", questionType: "inferred next action", prompt: "この会話の次に、店員がする可能性が高いことは何ですか。", options: ["注文を確認して料理を用意する", "駅へ行く", "本を読む", "家で寝る"], correctIndex: 0, explanation: "The clerk has accepted the order, so preparing the food is the next likely action.", targetItemIds: ["grammar-masu", "vocab-gohan", "vocab-mizu"], testedSkills: ["inference", "conversation context"] },
    ],
  },
  {
    id: "integrated-station",
    stimulusType: "dialogue",
    stimulus: "A：すみません。駅はどこですか。\nB：この道をまっすぐ行って、右へ曲がってください。入口は左にあります。",
    estimatedMinutes: 3,
    questions: [
      { id: "integrated-station-place", itemId: "vocab-doko", category: "vocabulary", questionType: "integrated vocabulary", prompt: "駅について、何を聞いていますか。", options: ["場所", "値段", "時間", "名前"], correctIndex: 0, explanation: "駅はどこですか asks where the station is.", targetItemIds: ["vocab-doko"], testedSkills: ["vocabulary meaning"] },
      { id: "integrated-station-particle", itemId: "grammar-de", category: "grammar", questionType: "particle choice", prompt: "この道___まっすぐ行ってください。", options: ["を", "に", "で", "の"], correctIndex: 0, explanation: "を marks the route or space through which the movement proceeds.", targetItemIds: ["grammar-wo", "vocab-massugu"], testedSkills: ["particle choice"] },
      { id: "integrated-station-detail", itemId: "listening-asking-directions", category: "listening", questionType: "listening detail", prompt: "駅の入口はどちらですか。", options: ["左", "右", "店の中", "家の上"], correctIndex: 0, explanation: "入口は左にあります。", targetItemIds: ["listening-asking-directions", "vocab-hidari"], testedSkills: ["listening detail"] },
    ],
  },
  {
    id: "integrated-schedule",
    stimulusType: "schedule",
    stimulus: "午前：大学で勉強\n午後：図書館で本を読む\n夜：家へ帰る\n日曜日：休み",
    estimatedMinutes: 3,
    questions: [
      { id: "integrated-schedule-time", itemId: "vocab-gozen", category: "vocabulary", questionType: "schedule vocabulary", prompt: "大学で勉強するのはいつですか。", options: ["午前", "午後", "夜", "日曜日"], correctIndex: 0, explanation: "午前は大学へ行きます。", targetItemIds: ["vocab-gozen"], testedSkills: ["schedule reading"] },
      { id: "integrated-schedule-location", itemId: "grammar-de", category: "grammar", questionType: "particle choice", prompt: "午後は図書館___本を読みます。", options: ["で", "に", "を", "の"], correctIndex: 0, explanation: "で marks the place where an action happens.", targetItemIds: ["grammar-de", "vocab-toshokan"], testedSkills: ["particle choice", "location vs action"] },
      { id: "integrated-schedule-inference", itemId: "reading-weekday-schedule", category: "reading", questionType: "inferred next action", prompt: "日曜日の予定から分かることは何ですか。", options: ["休む", "大学で勉強する", "図書館へ行く", "家へ帰る"], correctIndex: 0, explanation: "The schedule says 日曜日は休みます。", targetItemIds: ["reading-weekday-schedule", "grammar-masu"], testedSkills: ["inference", "reading detail"] },
    ],
  },
  {
    id: "integrated-shopping",
    stimulusType: "notice",
    stimulus: "買い物メモ\n朝ご飯のパン、魚、野菜、黒いかばん\n店は駅の近く",
    estimatedMinutes: 3,
    questions: [
      { id: "integrated-shopping-vocabulary", itemId: "vocab-kaimono", category: "vocabulary", questionType: "notice vocabulary", prompt: "このメモの目的は何ですか。", options: ["買う物を確認する", "駅への道を聞く", "友達を紹介する", "予定を断る"], correctIndex: 0, explanation: "It is a shopping memo listing things to buy.", targetItemIds: ["vocab-kaimono"], testedSkills: ["vocabulary meaning"] },
      { id: "integrated-shopping-particle", itemId: "grammar-ni", category: "grammar", questionType: "particle choice", prompt: "店は駅の近く___あります。", options: ["に", "で", "を", "と"], correctIndex: 0, explanation: "に marks the location where something exists with あります.", targetItemIds: ["grammar-ni", "vocab-eki", "vocab-chikaku"], testedSkills: ["particle choice", "existence location"] },
      { id: "integrated-shopping-detail", itemId: "reading-shopping-list", category: "reading", questionType: "reading detail", prompt: "黒いかばんについて、メモは何と言っていますか。", options: ["必要です", "駅で売っています", "買いません", "友達の物です"], correctIndex: 0, explanation: "黒いかばんも必要です。", targetItemIds: ["reading-shopping-list", "vocab-hitsuyou"], testedSkills: ["reading detail"] },
    ],
  },
];

function availableSet(value) {
  if (value instanceof Set) return value;
  if (Array.isArray(value)) return new Set(value.map((item) => typeof item === "string" ? item : item?.id).filter(Boolean));
  return new Set();
}

export function validateIntegratedExamSet(set, availableItemIds = []) {
  const available = availableSet(availableItemIds);
  const errors = [];
  if (!set?.reviewed) errors.push("set is not reviewed");
  if (!set?.id || !set?.stimulus?.trim()) errors.push("set needs an id and stimulus");
  const questions = Array.isArray(set?.questions) ? set.questions : [];
  if (!questions.length) errors.push("set needs questions");
  const ids = new Set();
  for (const question of questions) {
    if (ids.has(question.id)) errors.push(`duplicate question: ${question.id}`);
    ids.add(question.id);
    if (question.contextSetId !== set.id) errors.push(`question is outside context: ${question.id}`);
    if (!question.itemId || !question.targetItemIds?.length) errors.push(`question needs assessed and target concepts: ${question.id}`);
    if (available.size && [question.itemId, ...question.targetItemIds].some((id) => !available.has(id))) errors.push(`unknown target concept: ${question.id}`);
    if (question.validationStatus !== "validated") errors.push(`question is not validated: ${question.id}`);
  }
  return { valid: errors.length === 0, errors };
}

export function buildIntegratedExamSets(availableItemIds = []) {
  const available = availableSet(availableItemIds);
  return BLUEPRINTS.map((blueprint) => {
    const questions = blueprint.questions
      .filter((question) => !available.size || [question.itemId, ...question.targetItemIds].every((id) => available.has(id)))
      .map((question) => ({ ...question, prompt: `${blueprint.stimulus}\n\n${question.prompt}`, jlptLevel: "N5", contextSetId: blueprint.id, contextText: blueprint.stimulus, validationStatus: "validated", generatedBy: "kizashi-authored-integrated" }));
    const targetItemIds = [...new Set(questions.flatMap((question) => question.targetItemIds))];
    return { ...blueprint, reviewed: true, targetItemIds, testedSkills: [...new Set(questions.flatMap((question) => question.testedSkills))], questions };
  }).filter((set) => validateIntegratedExamSet(set, available).valid);
}

export function selectIntegratedExamSet(questions, seed = 0) {
  const groups = new Map();
  for (const question of Array.isArray(questions) ? questions : []) if (question.contextSetId) groups.set(question.contextSetId, [...(groups.get(question.contextSetId) ?? []), question]);
  const values = [...groups.values()].filter((group) => group.length);
  return values.length ? values[Math.abs(Number(seed) || 0) % values.length] : [];
}

export function conceptBreakdown(questions, answers) {
  return (Array.isArray(questions) ? questions : []).reduce((result, question) => {
    const answer = answers?.[question.id];
    if (typeof answer !== "boolean") return result;
    const itemId = question.itemId;
    result[itemId] ??= { correct: 0, total: 0 };
    result[itemId].total += 1;
    result[itemId].correct += answer ? 1 : 0;
    return result;
  }, {});
}
