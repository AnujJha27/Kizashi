import { readFile, writeFile } from "node:fs/promises";
import { getConjugationForms } from "../lib/conjugation-core.js";

const sourceFiles = [
  "n5-foundations.json",
  "n5-conversation-expansion.json",
  "n5-practical-expansion.json",
  "n5-life-expansion.json",
  "n4-grammar-expansion.json",
];

const modules = await Promise.all(sourceFiles.map(async (file) => JSON.parse(await readFile(new URL(`../data/${file}`, import.meta.url), "utf8"))));
const vocabulary = modules.flatMap((module) => module.vocabulary);
const meanings = vocabulary.flatMap((item) => item.meanings);
const writtenForms = vocabulary.map((item) => item.writtenForm);
const politeForms = vocabulary.map((item) => getConjugationForms(item).politeNonPast ?? item.writtenForm);

function rotateOptions(correct, distractors, seed) {
  const unique = [...new Set([correct, ...distractors.filter((value) => value !== correct)])].slice(0, 4);
  const offset = seed % unique.length;
  const options = [...unique.slice(offset), ...unique.slice(0, offset)];
  return { options, correctIndex: options.indexOf(correct) };
}

function review() {
  return {
    status: "draft",
    generatedBy: "michi-authored-vocabulary-draft",
    targetItemIds: [],
    reviewNotes: "Review the Japanese context, distractor naturalness, level, and answer key before approval.",
  };
}

const drafts = vocabulary.flatMap((item, index) => {
  const example = item.exampleSentences[0] ?? { japanese: item.writtenForm, translation: item.meanings[0] ?? "" };
  const contextTarget = [item.writtenForm, getConjugationForms(item).politeNonPast].find((form) => form && example.japanese.includes(form));
  const contextText = example.japanese;
  const contextPrompt = contextTarget ? `${example.translation}\n${contextText.replace(contextTarget, "＿＿")}` : `${example.translation}\n${contextText}\nWhich word is being practiced?`;
  const context = {
    id: `${item.id}-context-draft`,
    itemId: item.id,
    category: "vocabulary",
    questionType: "contextual vocabulary",
    jlptLevel: item.jlptLevel,
    prompt: contextPrompt,
    ...rotateOptions(contextTarget ?? item.writtenForm, contextTarget ? politeForms : writtenForms, index + 1),
    explanation: `${item.writtenForm} means ${item.meanings.join(" / ")} in this context.`,
    contextSetId: `${item.id}-context`,
    contextText,
    validationStatus: "generated",
    generatedBy: "michi-authored-vocabulary-draft",
    review: { ...review(), targetItemIds: [item.id] },
  };
  const paraphrase = {
    id: `${item.id}-paraphrase-draft`,
    itemId: item.id,
    category: "vocabulary",
    questionType: "paraphrase",
    jlptLevel: item.jlptLevel,
    prompt: `Which expression is closest in meaning to ${item.writtenForm}?`,
    ...rotateOptions(item.meanings[0], meanings, index + 2),
    explanation: `${item.writtenForm} means ${item.meanings.join(" / ")}.`,
    validationStatus: "generated",
    generatedBy: "michi-authored-vocabulary-draft",
    review: { ...review(), targetItemIds: [item.id] },
  };
  return [context, paraphrase];
});

await writeFile(new URL("../data/vocabulary-assessment-drafts.json", import.meta.url), `${JSON.stringify(drafts, null, 2)}\n`);
console.log(`Wrote ${drafts.length} vocabulary assessment drafts.`);
