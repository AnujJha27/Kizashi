import { n5Module } from "@/lib/curriculum";
import { isActivePracticeQuestion, validatePracticeQuestions } from "@/lib/content-validation";
import { n5ExamBlueprint } from "@/lib/jlpt";
import { buildIntegratedExamSets, selectIntegratedExamSet } from "@/lib/integrated-exam-core.js";
import type { N5Module, PracticeMode, PracticeQuestion } from "@/lib/types";

function rotateOptions(correct: string, distractors: string[], seed: number) {
  const values = [...new Set([correct, ...distractors.filter((value) => value !== correct)])].slice(0, 4);
  const offset = seed % values.length;
  const options = [...values.slice(offset), ...values.slice(0, offset)];
  return { options, correctIndex: options.indexOf(correct) };
}

function takeByCategory(questions: PracticeQuestion[], category: PracticeQuestion["category"], count: number) {
  const groups = new Map<string, PracticeQuestion[]>();
  questions.filter((question) => question.category === category).forEach((question) => groups.set(question.itemId, [...(groups.get(question.itemId) ?? []), question]));
  const selected: PracticeQuestion[] = [];
  for (let round = 0; selected.length < count; round += 1) {
    let added = false;
    for (const group of groups.values()) {
      if (group[round] && selected.length < count) { selected.push(group[round]); added = true; }
    }
    if (!added) break;
  }
  return selected;
}

function takeByQuestionTypes(questions: PracticeQuestion[], category: PracticeQuestion["category"], types: string[], count: number) {
  const pool = questions.filter((question) => question.category === category);
  const queues = new Map(types.map((type) => [type, takeByCategory(pool.filter((question) => question.questionType === type), category, count)]));
  const selected: PracticeQuestion[] = [];
  for (let round = 0; selected.length < count; round += 1) {
    for (const type of types) {
      const question = queues.get(type)?.[round];
      if (question && !selected.includes(question)) selected.push(question);
      if (selected.length === count) break;
    }
    if (!types.some((type) => queues.get(type)?.[round])) break;
  }
  return selected.length === count ? selected : [...selected, ...takeByCategory(pool.filter((question) => !selected.includes(question)), category, count - selected.length)];
}

const listeningTypes = ["task-based response", "key point", "verbal expression", "quick response"];

function takeListening(questions: PracticeQuestion[], count: number) {
  return takeByQuestionTypes(questions, "listening", listeningTypes, count);
}

function takeGrammar(questions: PracticeQuestion[], count: number) {
  const grammar = questions.filter((question) => question.category === "grammar");
  const ordering = grammar.find((question) => question.questionType === "sentence ordering");
  const selected = takeByCategory(grammar.filter((question) => question !== ordering), "grammar", ordering && count > 1 ? count - 1 : count);
  return ordering && count > 1 ? [...selected, ordering] : selected;
}

function takeQuick(questions: PracticeQuestion[]) {
  let selected = [
    ...takeByQuestionTypes(questions, "vocabulary", ["kana recall", "orthography", "audio recognition", "meaning"], 2),
    ...takeByQuestionTypes(questions, "kanji", ["kana recall", "kanji reading", "kanji in context"], 1),
    ...takeGrammar(questions, 2),
    ...takeByCategory(questions, "reading", 1),
    ...takeListening(questions, 1),
  ];
  const add = (category: PracticeQuestion["category"], types: string[], count: number) => {
    const remaining = questions.filter((question) => question.category === category && !selected.includes(question));
    selected = [...selected, ...takeByQuestionTypes(remaining, category, types, count)];
  };
  add("vocabulary", ["Japanese recall", "contextual vocabulary", "paraphrase", "orthography", "meaning"], 2);
  add("kanji", ["kanji in context", "orthography", "word to kanji recall", "kanji meaning", "kanji reading"], 1);
  const remainingGrammar = questions.filter((question) => question.category === "grammar" && !selected.includes(question));
  selected = [...selected, ...takeGrammar(remainingGrammar, 1)];
  add("reading", ["information retrieval", "short passage detail"], 1);
  selected = [...selected, ...takeListening(questions.filter((question) => question.category === "listening" && !selected.includes(question)), 1)];
  return selected;
}

const politeForms: Record<string, string> = { "食べる": "食べます", "飲む": "飲みます", "行く": "行きます", "来る": "来ます", "見る": "見ます", "勉強する": "勉強します", "買う": "買います", "話す": "話します", "休む": "休みます", "読む": "読みます", "書く": "書きます", "聞く": "聞きます", "する": "します", "遊ぶ": "遊びます", "会う": "会います", "帰る": "帰ります", "乗る": "乗ります", "降りる": "降ります", "分かる": "分かります", "教える": "教えます", "使う": "使います", "持つ": "持ちます", "住む": "住みます" };

export function getPracticeQuestions(module: N5Module = n5Module) {
  const questions: PracticeQuestion[] = [];

  module.vocabulary.forEach((item, index) => {
    if (!item.writtenForm || !item.reading || !item.meanings.length) return;
    const meaningChoices = rotateOptions(item.meanings[0], module.vocabulary.flatMap((entry) => entry.meanings), index);
    questions.push({ id: `${item.id}-meaning`, itemId: item.id, category: "vocabulary", questionType: "meaning", jlptLevel: item.jlptLevel, prompt: `What does ${item.writtenForm} mean?`, ...meaningChoices, explanation: `${item.writtenForm} is used for ${item.meanings.join(" / ")}.` });
    const example = item.exampleSentences[0] ?? { japanese: item.writtenForm, translation: item.meanings[0] ?? "" };
    const contextTarget = [item.writtenForm, politeForms[item.writtenForm]].find((form) => example.japanese.includes(form));
    const contextChoices = rotateOptions(contextTarget ?? item.writtenForm, module.vocabulary.map((entry) => politeForms[entry.writtenForm] ?? entry.writtenForm), index + 1);
    questions.push({ id: `${item.id}-context`, itemId: item.id, category: "vocabulary", questionType: "contextual vocabulary", jlptLevel: item.jlptLevel, prompt: `${example.translation}\n${contextTarget ? example.japanese.replace(contextTarget, "＿＿") : `${example.japanese}\nWhich word is being practiced?`}`, ...contextChoices, explanation: `${item.writtenForm} means ${item.meanings.join(" / ")} in this context.` });
    const paraphraseChoices = rotateOptions(item.meanings[0], module.vocabulary.flatMap((entry) => entry.meanings), index + 2);
    questions.push({ id: `${item.id}-paraphrase`, itemId: item.id, category: "vocabulary", questionType: "paraphrase", jlptLevel: item.jlptLevel, prompt: `Which expression is closest in meaning to ${item.writtenForm}?`, ...paraphraseChoices, explanation: `${item.writtenForm} means ${item.meanings.join(" / ")}.` });
    const orthographyChoices = rotateOptions(item.writtenForm, module.vocabulary.map((entry) => entry.writtenForm), index + 4);
    questions.push({ id: `${item.id}-orthography`, itemId: item.id, category: "vocabulary", questionType: "orthography", jlptLevel: item.jlptLevel, prompt: `Which written form matches ${item.reading}?`, ...orthographyChoices, explanation: `${item.reading} is written ${item.writtenForm}.` });
    questions.push({ id: `${item.id}-reading-recall`, itemId: item.id, category: "vocabulary", questionType: "kana recall", jlptLevel: item.jlptLevel, prompt: `Type the reading for ${item.writtenForm}.`, options: [], correctIndex: 0, answerMode: "text", acceptedAnswers: [item.reading], answerPlaceholder: "ひらがな", explanation: `${item.writtenForm} is read ${item.reading}.` });
    questions.push({ id: `${item.id}-production`, itemId: item.id, category: "vocabulary", questionType: "Japanese recall", jlptLevel: item.jlptLevel, prompt: `Write the Japanese for: ${item.meanings[0]}.`, options: [], correctIndex: 0, answerMode: "text", acceptedAnswers: [item.writtenForm], answerPlaceholder: "Japanese", explanation: `The Japanese word is ${item.writtenForm} (${item.reading}).` });
    const audioChoices = rotateOptions(item.meanings[0], module.vocabulary.flatMap((entry) => entry.meanings), index + 3);
    questions.push({ id: `${item.id}-audio`, itemId: item.id, category: "vocabulary", questionType: "audio recognition", jlptLevel: item.jlptLevel, prompt: "Listen to the word. What does it mean?", ...audioChoices, explanation: `${item.reading} means ${item.meanings.join(" / ")}.`, audioText: item.reading, audioUrl: item.audioUrl });
  });

  module.kanji.forEach((item, index) => {
    if (!item.character || !item.meanings.length || (!item.kunyomi.length && !item.onyomi.length)) return;
    const correct = item.kunyomi[0] ?? item.onyomi[0] ?? item.character;
    const choices = rotateOptions(correct, module.kanji.flatMap((entry) => [...entry.kunyomi, ...entry.onyomi]), index);
    questions.push({ id: `${item.id}-reading`, itemId: item.id, category: "kanji", questionType: "kanji reading", jlptLevel: item.jlptLevel, prompt: `Choose one reading for ${item.character}.`, ...choices, explanation: `${item.character} appears in ${item.usefulWords.slice(0, 2).map((word) => `${word.word} (${word.reading})`).join(" and ")}.` });
    const acceptedReadings = [...new Set([...item.kunyomi, ...item.onyomi].filter(Boolean))];
    questions.push({ id: `${item.id}-reading-recall`, itemId: item.id, category: "kanji", questionType: "kana recall", jlptLevel: item.jlptLevel, prompt: `Type one reading for ${item.character}.`, options: [], correctIndex: 0, answerMode: "text", acceptedAnswers: acceptedReadings, answerPlaceholder: "かな or 音読み", explanation: `${item.character} can be read ${acceptedReadings.join(" / ")}.` });
    const meaningChoices = rotateOptions(item.meanings[0], module.kanji.filter((entry) => entry.id !== item.id).flatMap((entry) => entry.meanings), index + 1);
    questions.push({ id: `${item.id}-meaning`, itemId: item.id, category: "kanji", questionType: "kanji meaning", jlptLevel: item.jlptLevel, prompt: `What does ${item.character} mean?`, ...meaningChoices, explanation: `${item.character} can mean ${item.meanings.join(" / ")}.` });
    item.usefulWords.forEach((word, wordIndex) => {
      const wordChoices = rotateOptions(word.word, module.kanji.filter((entry) => entry.id !== item.id).flatMap((entry) => entry.usefulWords.map((entryWord) => entryWord.word)), index + wordIndex + 2);
      questions.push({ id: wordIndex === 0 ? `${item.id}-word` : `${item.id}-word-${wordIndex}-orthography`, itemId: item.id, category: "kanji", questionType: "orthography", jlptLevel: item.jlptLevel, prompt: `Which word is read ${word.reading}?`, ...wordChoices, explanation: `${word.word} is read ${word.reading} and means ${word.meaning}.` });
      const characterChoices = rotateOptions(item.character, module.kanji.filter((entry) => entry.id !== item.id).map((entry) => entry.character), index + wordIndex + 3);
      questions.push({ id: wordIndex === 0 ? `${item.id}-recall` : `${item.id}-word-${wordIndex}-kanji`, itemId: item.id, category: "kanji", questionType: "word to kanji recall", jlptLevel: item.jlptLevel, prompt: `Which kanji is used in ${word.word} (${word.reading})?`, ...characterChoices, explanation: `${word.word} uses ${item.character}, meaning ${item.meanings.join(" / ")}.` });
      const readingChoices = rotateOptions(word.reading, [...item.usefulWords.map((entry) => entry.reading), ...module.vocabulary.map((entry) => entry.reading)], index + wordIndex + 4);
      if (readingChoices.options.length > 1) questions.push({ id: `${item.id}-word-${wordIndex}-reading`, itemId: item.id, category: "kanji", questionType: "reading in context", jlptLevel: item.jlptLevel, prompt: `How is ${word.word} read?`, ...readingChoices, explanation: `${word.word} is read ${word.reading} and means ${word.meaning}.` });
      if (wordIndex === 0) {
        const vocabulary = module.vocabulary.find((entry) => entry.writtenForm === word.word);
        const example = vocabulary?.exampleSentences[0];
        if (example?.japanese.includes(word.word)) {
          const contextChoices = rotateOptions(word.word, module.kanji.flatMap((entry) => entry.usefulWords.map((usefulWord) => usefulWord.word)), index + wordIndex + 5);
          questions.push({ id: `${item.id}-context`, itemId: item.id, category: "kanji", questionType: "kanji in context", jlptLevel: item.jlptLevel, prompt: `${example.translation}\n${example.japanese.replace(word.word, "＿＿")}`, ...contextChoices, explanation: `${word.word} completes the sentence and is read ${word.reading}.` });
        }
      }
    });
  });

  const completionPrompts: Record<string, { prompt: string; correct: string; distractors: string[] }> = {
    "grammar-desu": { prompt: "私は学生___。", correct: "です", distractors: ["ます", "でした", "か"] },
    "grammar-wa": { prompt: "私___大学生です。", correct: "は", distractors: ["が", "に", "で"] },
    "grammar-ka": { prompt: "学生です___。", correct: "か", distractors: ["は", "に", "を"] },
    "grammar-ni": { prompt: "大学___行きます。", correct: "に", distractors: ["で", "は", "を"] },
    "grammar-masu": { prompt: "毎日、本を読み___。", correct: "ます", distractors: ["です", "でした", "ませんか"] },
    "grammar-masen": { prompt: "今日は学校へ行き___。", correct: "ません", distractors: ["ます", "ました", "です"] },
    "grammar-mashita": { prompt: "昨日、本を読み___。", correct: "ました", distractors: ["ます", "ません", "です"] },
    "grammar-suki": { prompt: "私は日本語が___です。", correct: "好き", distractors: ["欲しい", "大きい", "新しい"] },
    "grammar-hoshii": { prompt: "新しい傘が___です。", correct: "欲しい", distractors: ["好き", "安い", "ありません"] },
    "grammar-kudasai": { prompt: "水を___。", correct: "ください", distractors: ["です", "ます", "でした"] },
    "grammar-arimasu": { prompt: "駅にコンビニが___。", correct: "あります", distractors: ["います", "です", "ください"] },
    "grammar-wo": { prompt: "本___読みます。", correct: "を", distractors: ["に", "で", "と"] },
    "grammar-de": { prompt: "家___勉強します。", correct: "で", distractors: ["に", "を", "の"] },
    "grammar-to": { prompt: "友達___話します。", correct: "と", distractors: ["で", "を", "も"] },
    "grammar-no": { prompt: "これは私___本です。", correct: "の", distractors: ["も", "と", "で"] },
    "grammar-mo": { prompt: "私___学生です。", correct: "も", distractors: ["の", "を", "に"] },
    "grammar-kore": { prompt: "___は私の本です。", correct: "これ", distractors: ["どこ", "だれ", "いつ"] },
    "grammar-doko": { prompt: "駅は___ですか。", correct: "どこ", distractors: ["これ", "だれ", "なに"] },
    "grammar-imasu": { prompt: "部屋に友達が___。", correct: "います", distractors: ["あります", "です", "ください"] },
    "grammar-i-adjective": { prompt: "It is cold today: 今日は___です。", correct: "寒い", distractors: ["寒くない", "寒かった", "高い"] },
    "grammar-dictionary-form": { prompt: "Choose the plain form: 週末に図書館へ___。", correct: "行く", distractors: ["行きます", "行きました", "行きません"] },
    "grammar-te-form": { prompt: "本を読ん___、勉強します。", correct: "で", distractors: ["て", "ます", "だ"] },
    "grammar-tai": { prompt: "本を読み___です。", correct: "たい", distractors: ["ます", "ました", "ません"] },
    "grammar-counters": { prompt: "本を三___買いました。", correct: "冊", distractors: ["人", "円", "時"] },
    "grammar-yori": { prompt: "電車はバス___大きいです。", correct: "より", distractors: ["から", "まで", "と"] },
    "grammar-kara": { prompt: "雨です___、家にいます。", correct: "から", distractors: ["より", "まで", "でも"] },
    "grammar-temoii": { prompt: "ここで話し___もいいですか。", correct: "て", distractors: ["た", "ます", "ない"] },
    "grammar-mashou": { prompt: "一緒に行き___。", correct: "ましょう", distractors: ["ます", "ません", "ました"] },
    "grammar-masenka": { prompt: "一緒に勉強し___。", correct: "ませんか", distractors: ["ましょう", "ましたか", "ないです"] },
    "grammar-kara-made": { prompt: "九時___五時___勉強します。", correct: "から / まで", distractors: ["まで / から", "に / で", "と / も"] },
    "grammar-ya": { prompt: "本___ノートがあります。", correct: "や", distractors: ["を", "に", "が"] },
    "grammar-te-kudasai": { prompt: "名前を書い___ください。", correct: "て", distractors: ["た", "ます", "ない"] },
    "grammar-adverb-totemo": { prompt: "この本は___面白いです。", correct: "とても", distractors: ["いつ", "まだ", "から"] },
    "grammar-na-adjective": { prompt: "この店は便利___。", correct: "です", distractors: ["いです", "なです", "ます"] },
    "grammar-i-adjective-negative": { prompt: "駅は遠___です。", correct: "くない", distractors: ["い", "かった", "くなかった"] },
    "grammar-i-adjective-past": { prompt: "昨日は暑___です。", correct: "かった", distractors: ["い", "くない", "くなかった"] },
    "grammar-teiru": { prompt: "今、料理をし___います。", correct: "て", distractors: ["た", "ます", "ない"] },
    "grammar-tewaikenai": { prompt: "ここで写真を撮っ___はいけません。", correct: "て", distractors: ["た", "ます", "ない"] },
    "grammar-naidekudasai": { prompt: "ここで話さ___ください。", correct: "ないで", distractors: ["ない", "なくて", "ません"] },
    "grammar-nai-form": { prompt: "今日は学校へ行か___。", correct: "ない", distractors: ["ません", "なかった", "なくて"] },
    "grammar-ta-form": { prompt: "昨日、映画を見___。", correct: "た", distractors: ["て", "ます", "ない"] },
    "grammar-mae-ni": { prompt: "寝る___、本を読みます。", correct: "前に", distractors: ["あとで", "とき", "ながら"] },
    "grammar-ato-de": { prompt: "ご飯を食べた___、勉強します。", correct: "あとで", distractors: ["前に", "とき", "ながら"] },
    "grammar-toki": { prompt: "寒い___、家にいます。", correct: "とき", distractors: ["あとで", "前に", "ながら"] },
    "grammar-nagara": { prompt: "音楽を聞き___、勉強します。", correct: "ながら", distractors: ["とき", "あとで", "前に"] },
  };
  const orderingPrompts: Record<string, { tokens: string[]; correctOrder: number[] }> = {
    "grammar-wa": { tokens: ["私は", "日本語を", "勉強します。"], correctOrder: [0, 1, 2] },
    "grammar-ni": { tokens: ["七時に", "起きます。"], correctOrder: [0, 1] },
    "grammar-de": { tokens: ["家で", "勉強します。"], correctOrder: [0, 1] },
    "grammar-to": { tokens: ["友達と", "話します。"], correctOrder: [0, 1] },
    "grammar-no": { tokens: ["これは", "私の", "本です。"], correctOrder: [0, 1, 2] },
    "grammar-te-form": { tokens: ["朝", "起きて、", "水を", "飲みます。"], correctOrder: [0, 1, 2, 3] },
    "grammar-tai": { tokens: ["日本語を", "勉強し", "たいです。"], correctOrder: [0, 1, 2] },
    "grammar-yori": { tokens: ["電車は", "バスより", "大きいです。"], correctOrder: [0, 1, 2] },
    "grammar-kara": { tokens: ["雨ですから、", "家に", "います。"], correctOrder: [0, 1, 2] },
    "grammar-mashou": { tokens: ["一緒に", "行きましょう。"], correctOrder: [0, 1] },
    "grammar-masenka": { tokens: ["一緒に", "勉強しませんか。"], correctOrder: [0, 1] },
    "grammar-ta-form": { tokens: ["昨日", "映画を", "見た。"], correctOrder: [0, 1, 2] },
    "grammar-mae-ni": { tokens: ["寝る前に", "本を", "読みます。"], correctOrder: [0, 1, 2] },
    "grammar-ato-de": { tokens: ["ご飯を食べたあとで", "勉強します。"], correctOrder: [0, 1] },
    "grammar-toki": { tokens: ["寒いとき", "家に", "います。"], correctOrder: [0, 1, 2] },
    "grammar-nagara": { tokens: ["音楽を聞きながら", "勉強します。"], correctOrder: [0, 1] },
  };

  module.grammar.forEach((item, index) => {
    if (!item.pattern || !item.meaning) return;
    const authoredQuestionIds = item.practiceQuestionIds ?? [];
    const meaningChoices = rotateOptions(item.meaning, module.grammar.map((entry) => entry.meaning), index);
    questions.push({ id: authoredQuestionIds[0] ?? `${item.id}-meaning`, itemId: item.id, category: "grammar", questionType: "meaning", jlptLevel: item.jlptLevel, prompt: `What does ${item.pattern} do?`, ...meaningChoices, explanation: item.intuition });
    const completion = completionPrompts[item.id];
    if (completion) {
      const choices = rotateOptions(completion.correct, completion.distractors, index);
      questions.push({ id: authoredQuestionIds[1] ?? `${item.id}-completion`, itemId: item.id, category: "grammar", questionType: "sentence composition", jlptLevel: item.jlptLevel, prompt: completion.prompt, ...choices, explanation: `${item.pattern}: ${item.meaning}.` });
    }
    const example = item.examples[0];
    const contextChoices = rotateOptions(item.meaning, module.grammar.filter((entry) => entry.id !== item.id).map((entry) => entry.meaning), index + 5);
    if (example && contextChoices.options.length > 1) questions.push({ id: `${item.id}-context`, itemId: item.id, category: "grammar", questionType: "grammar in context", jlptLevel: item.jlptLevel, prompt: `${example.japanese}\nWhat does ${item.pattern} express here?`, ...contextChoices, explanation: `${item.pattern} expresses ${item.meaning}.` });
    const secondExample = item.examples[1];
    const secondContextChoices = rotateOptions(item.meaning, module.grammar.filter((entry) => entry.id !== item.id).map((entry) => entry.meaning), index + 19);
    if (secondExample && secondContextChoices.options.length > 1) questions.push({ id: `${item.id}-context-2`, itemId: item.id, category: "grammar", questionType: "grammar in context", jlptLevel: item.jlptLevel, prompt: `${secondExample.japanese}\nWhat does ${item.pattern} express here?`, ...secondContextChoices, explanation: `${item.pattern} expresses ${item.meaning}.` });
    if (item.id === "grammar-masu") {
      const textChoices = rotateOptions("ます", ["ました", "ません", "です"], index + 1);
      questions.push({ id: "grammar-masu-text", itemId: item.id, category: "grammar", questionType: "text grammar", jlptLevel: item.jlptLevel, prompt: "毎日、本を読み___。それから、勉強します。", ...textChoices, explanation: "The text describes a regular present habit, so the polite non-past ending ます fits." });
    }
    if (item.id === "grammar-masu") questions.push({ id: "grammar-masu-order", itemId: item.id, category: "grammar", questionType: "sentence ordering", jlptLevel: item.jlptLevel, prompt: "Build the natural sentence.", options: ["昨日", "本を", "三冊", "買いました。"], correctIndex: 0, tokens: ["昨日", "本を", "三冊", "買いました。"], correctOrder: [0, 1, 2, 3], explanation: "昨日 sets the time, 本を is the object, 三冊 is the counter, and 買いました closes the sentence." });
    const ordering = orderingPrompts[item.id];
    if (ordering) questions.push({ id: `${item.id}-order`, itemId: item.id, category: "grammar", questionType: "sentence ordering", jlptLevel: item.jlptLevel, prompt: "Build the natural sentence.", options: ordering.tokens, correctIndex: 0, ...ordering, explanation: `${item.pattern} works by placing the sentence pieces in a natural Japanese order.` });
  });

  module.readings.forEach((item) => {
    if (!item.passage || !item.questions?.length) return;
    item.questions?.forEach((question, index) => questions.push({ id: `${item.id}-question-${index}`, itemId: item.id, category: "reading", questionType: question.questionType ?? (index === 0 ? "short passage detail" : "information retrieval"), jlptLevel: item.jlptLevel, prompt: `${item.passage}\n\n${question.prompt}`, options: question.options, correctIndex: question.correctAnswer, explanation: question.explanation ?? item.translation }));
    const titleChoices = rotateOptions(item.title, module.readings.filter((entry) => entry.id !== item.id).map((entry) => entry.title), item.id.length);
    if (titleChoices.options.length > 1) questions.push({ id: `${item.id}-main-idea`, itemId: item.id, category: "reading", questionType: "main idea", jlptLevel: item.jlptLevel, prompt: `${item.passage}\n\nWhat is this passage mainly about?`, ...titleChoices, explanation: `This passage is about ${item.title}.` });
  });

  module.listening.forEach((item) => {
    if (!item.transcript || !item.questions?.length) return;
    item.questions.forEach((question, index) => questions.push({ id: `${item.id}-question-${index}`, itemId: item.id, category: "listening", questionType: question.questionType ?? (index === 0 ? "key point" : "quick response"), jlptLevel: item.jlptLevel, prompt: question.prompt, options: question.answers, correctIndex: question.correctAnswer, explanation: question.explanation ?? item.situation, audioUrl: item.audioUrl, audioText: item.transcript }));
  });

  const availableItemIds = new Set([...module.vocabulary, ...module.kanji, ...module.grammar, ...module.readings, ...module.listening].map((item) => item.id));
  const integratedQuestions: PracticeQuestion[] = buildIntegratedExamSets([...availableItemIds]).flatMap((set) => set.questions) as PracticeQuestion[];
  const generatedQuestions: PracticeQuestion[] = [...questions, ...integratedQuestions].map((question) => ({ ...question, validationStatus: question.validationStatus ?? "validated" as const, generatedBy: question.generatedBy ?? "michi-question-factory" })) as PracticeQuestion[];
  const remoteQuestions = module.practiceQuestions ?? [];
  if (!remoteQuestions.length) return generatedQuestions;
  const remoteIds = new Set(remoteQuestions.map((question) => question.id));
  return [...generatedQuestions.filter((question) => !remoteIds.has(question.id)), ...remoteQuestions];
}

export function getValidatedPracticeQuestions(module: N5Module = n5Module) {
  const questions = getPracticeQuestions(module);
  const items = [...module.vocabulary, ...module.kanji, ...module.grammar, ...module.readings, ...module.listening];
  const itemIds = new Set(items.map((item) => item.id));
  const itemCategories = new Map(items.map((item) => [item.id, item.category]));
  const seen = new Set<string>();
  return questions.filter((question) => {
    if (seen.has(question.id)) return false;
    seen.add(question.id);
    return isActivePracticeQuestion(question) && validatePracticeQuestions([question], itemIds, itemCategories).valid;
  });
}

const questionFamilyAliases: Record<string, string> = { "sentence completion": "sentence composition", "short passage detail": "short passage" };

export function getN5PracticeCoverage(module: N5Module = n5Module) {
  const items = [...module.vocabulary, ...module.kanji, ...module.grammar, ...module.readings, ...module.listening];
  const questions = getValidatedPracticeQuestions(module);
  const coveredItemIds = new Set(questions.map((question) => question.itemId));
  const requiredFamilies = [...new Set(n5ExamBlueprint.filter((entry) => entry.level === "N5").map((entry) => entry.questionType))];
  const coveredFamilies = new Set(questions.filter((question) => question.jlptLevel === "N5").map((question) => questionFamilyAliases[question.questionType] ?? question.questionType));
  const uncoveredItemIds = items.filter((item) => !coveredItemIds.has(item.id)).map((item) => item.id);
  const missingFamilies = requiredFamilies.filter((family) => !coveredFamilies.has(family));
  return { itemCount: items.length, questionCount: questions.length, coveredItemCount: items.length - uncoveredItemIds.length, uncoveredItemIds, requiredFamilies, missingFamilies, complete: uncoveredItemIds.length === 0 && missingFamilies.length === 0 };
}

export function migrateLegacyQuestionPrompts(questions: PracticeQuestion[], module: N5Module) {
  const kanjiByCharacter = new Map(module.kanji.map((item) => [item.character, item]));
  return questions.map((question) => {
    if (question.category !== "kanji" || question.questionType !== "orthography") return question;
    const match = /^Which written word uses (.+)\?$/u.exec(question.prompt.trim());
    const item = match ? kanjiByCharacter.get(match[1].trim()) : undefined;
    const answer = item?.usefulWords.find((word) => word.word === question.options[question.correctIndex]);
    return answer ? { ...question, prompt: `Which word is read ${answer.reading}?` } : question;
  });
}

export function selectPracticeQuestions(mode: PracticeMode, questions = getValidatedPracticeQuestions()) {
  const calibrated = questions.filter((question) => question.jlptLevel === "N5");
  if (mode === "integrated") return selectIntegratedExamSet(calibrated, new Date().getDate());
  if (mode === "quick") return takeQuick(questions);
  if (mode === "mini") return takeQuick(questions).slice(0, 10);
  if (mode === "section") return [...takeByQuestionTypes(calibrated, "vocabulary", ["kana recall", "contextual vocabulary", "orthography", "paraphrase", "meaning"], 5), ...takeByQuestionTypes(calibrated, "kanji", ["kana recall", "kanji in context", "reading in context", "orthography", "kanji reading"], 3), ...takeByQuestionTypes(calibrated, "grammar", ["sentence composition", "sentence completion", "grammar in context", "text grammar", "sentence ordering", "meaning"], 5), ...takeByCategory(calibrated, "reading", 3), ...takeListening(calibrated, 3)];
  // ponytail: fixed exam counts fit the authored bank; increase them after the item bank is expanded and calibrated.
  if (mode === "full") return [...takeByQuestionTypes(calibrated, "vocabulary", ["kana recall", "audio recognition", "contextual vocabulary", "orthography", "paraphrase", "Japanese recall", "meaning"], 12), ...takeByQuestionTypes(calibrated, "kanji", ["kana recall", "kanji in context", "reading in context", "orthography", "word to kanji recall", "kanji meaning", "kanji reading"], 6), ...takeByQuestionTypes(calibrated, "grammar", ["sentence composition", "sentence completion", "grammar in context", "text grammar", "sentence ordering", "meaning"], 10), ...takeByCategory(calibrated, "reading", 6), ...takeListening(calibrated, 6)];
  if (mode === "mock") return [...takeByQuestionTypes(calibrated, "vocabulary", ["kana recall", "contextual vocabulary", "orthography", "paraphrase", "meaning"], 6), ...takeByQuestionTypes(calibrated, "kanji", ["kana recall", "kanji in context", "reading in context", "orthography", "kanji reading"], 3), ...takeByQuestionTypes(calibrated, "grammar", ["sentence composition", "sentence completion", "grammar in context", "sentence ordering", "meaning"], 5), ...takeByCategory(calibrated, "reading", 3), ...takeListening(calibrated, 3)];
  if (mode === "pass") return selectPracticeQuestions("mixed", questions);
  if (mode === "mixed") return [...takeByQuestionTypes(questions, "vocabulary", ["kana recall", "Japanese recall", "orthography", "audio recognition", "meaning"], 3), ...takeByQuestionTypes(questions, "kanji", ["kana recall", "kanji in context", "reading in context", "orthography", "kanji reading"], 2), ...takeGrammar(questions, 3), ...takeByCategory(questions, "reading", 2), ...takeListening(questions, 2)];
  if (mode === "grammar") return takeGrammar(questions, 12);
  if (mode === "vocabulary") return takeByQuestionTypes(questions, "vocabulary", ["kana recall", "Japanese recall", "orthography", "audio recognition", "meaning", "contextual vocabulary", "paraphrase"], 12);
  if (mode === "kanji") return takeByQuestionTypes(questions, "kanji", ["kana recall", "kanji in context", "reading in context", "kanji reading", "kanji meaning", "orthography", "word to kanji recall"], 12);
  if (mode === "weak") return [];
  return takeByCategory(questions, mode as PracticeQuestion["category"], 12);
}
