import type { ContentSource, CurriculumBand, CurriculumClassification, ExamSkillMastery, ExamReadinessStatus, JLPTSpecification, LearningCategory, LearningItem } from "@/lib/types";
import type { ExamAttempt, ReviewRecord } from "@/lib/session";
import { aggregateExamEvidence, chooseReadinessPriority } from "@/lib/jlpt-core.js";

export const n5ExamRequirements = {
  overallMinimum: 80,
  overallMaximum: 180,
  languageReadingMinimum: 38,
  languageReadingMaximum: 120,
  listeningMinimum: 19,
  listeningMaximum: 60,
} as const;

export const n5ExamBlueprint: JLPTSpecification[] = [
  { level: "N5", section: "Vocabulary", questionType: "kanji reading", testedSkill: "vocabulary", approximateFormat: "Read familiar kanji in context", source: "JLPT N5 purposes of test items" },
  { level: "N5", section: "Vocabulary", questionType: "orthography", testedSkill: "vocabulary", approximateFormat: "Choose the written form that matches a familiar word", source: "JLPT N5 purposes of test items" },
  { level: "N5", section: "Vocabulary", questionType: "contextual vocabulary", testedSkill: "vocabulary", approximateFormat: "Choose the word that completes a sentence", source: "JLPT N5 purposes of test items" },
  { level: "N5", section: "Vocabulary", questionType: "paraphrase", testedSkill: "vocabulary", approximateFormat: "Choose an expression with a similar meaning", source: "JLPT N5 purposes of test items" },
  { level: "N5", section: "Grammar", questionType: "sentence composition", testedSkill: "grammar", approximateFormat: "Choose the form that makes the sentence natural", source: "JLPT N5 purposes of test items" },
  { level: "N5", section: "Grammar", questionType: "sentence ordering", testedSkill: "grammar", approximateFormat: "Arrange familiar words into a natural sentence", source: "JLPT N5 purposes of test items" },
  { level: "N5", section: "Grammar", questionType: "text grammar", testedSkill: "grammar", approximateFormat: "Choose the connective or form that fits a short text", source: "JLPT N5 purposes of test items" },
  { level: "N5", section: "Reading", questionType: "short passage", testedSkill: "reading", approximateFormat: "Understand a short everyday text", source: "JLPT N5 purposes of test items" },
  { level: "N5", section: "Reading", questionType: "mid-length passage", testedSkill: "reading", approximateFormat: "Follow the main point of a longer beginner text", source: "JLPT N5 purposes of test items" },
  { level: "N5", section: "Reading", questionType: "information retrieval", testedSkill: "reading", approximateFormat: "Find a specific detail in practical material", source: "JLPT N5 purposes of test items" },
  { level: "N5", section: "Listening", questionType: "task-based response", testedSkill: "listening", approximateFormat: "Choose the action that completes a situation", source: "JLPT N5 purposes of test items" },
  { level: "N5", section: "Listening", questionType: "key point", testedSkill: "listening", approximateFormat: "Understand the main point of a short exchange", source: "JLPT N5 purposes of test items" },
  { level: "N5", section: "Listening", questionType: "verbal expression", testedSkill: "listening", approximateFormat: "Choose a natural expression for the situation", source: "JLPT N5 purposes of test items" },
  { level: "N5", section: "Listening", questionType: "quick response", testedSkill: "listening", approximateFormat: "Choose a natural response immediately", source: "JLPT N5 purposes of test items" },
];

export const contentSources: ContentSource[] = [
  { id: "jlpt-official-blueprint", name: "Official JLPT N5 item purposes", type: "official", url: "https://www.jlpt.jp/e/guideline/pdf/n5_e_revised.pdf", notes: "Exam-format calibration, not a content dump." },
  { id: "jmdict", name: "JMdict", type: "dictionary", url: "https://www.edrdg.org/jmdict/j_jmdict.html", license: "EDRDG licence" },
  { id: "jmdict-examples", name: "JMdict linked examples", type: "examples", url: "https://ftp.edrdg.org/pub/Nihongo/00INDEX.html", license: "EDRDG licence", notes: "Example enrichment source; review examples before publishing." },
  { id: "kanjidic2", name: "KANJIDIC2", type: "dictionary", url: "https://www.edrdg.org/wiki/KANJIDIC_Project.html", license: "CC BY-SA 4.0" },
  { id: "openjlpt", name: "OpenJLPT", type: "curriculum", url: "https://github.com/evanclan/OpenJLPT", license: "CC BY-SA 4.0", notes: "Staging level spine; community classification requires review." },
  { id: "bccwj", name: "NINJAL BCCWJ frequency list", type: "frequency", url: "https://clrd.ninjal.ac.jp/bccwj/freq-list.html", license: "CC BY-NC-ND 3.0", notes: "Frequency enrichment; not a curriculum replacement." },
  { id: "csj-frequency", name: "NINJAL CSJ frequency list", type: "frequency", url: "https://repository.ninjal.ac.jp/records/3276", license: "CC BY-NC-ND 3.0", notes: "Broad spoken-frequency signal; owner-authorized derived aggregates may publish only to the private allowlisted package through the explicit export path. Raw source data remains excluded." },
  { id: "irodori", name: "Japan Foundation Irodori", type: "curriculum", url: "https://www.irodori.jpf.go.jp/en/resources.html", notes: "Lesson vocabulary, sentence patterns, and kanji progression; review terms before publishing derived content." },
  { id: "tae-kim", name: "Tae Kim's Guide to Japanese", type: "curriculum", url: "https://guidetojapanese.org/learn/grammar", license: "CC BY-NC-SA 3.0", notes: "Alternative explanation references; adapted text must retain attribution and ShareAlike handling." },
  { id: "wikibooks-japanese", name: "Wikibooks Japanese", type: "curriculum", url: "https://en.wikibooks.org/wiki/Japanese_Grammar", license: "CC BY-SA 4.0 / GFDL", notes: "API-backed supplementary reference; retain attribution and source page." },
  { id: "wikimedia-commons", name: "Wikimedia Commons / Lingua Libre", type: "examples", url: "https://commons.wikimedia.org/wiki/Category:Japanese_pronunciation", notes: "Dynamic exact-match human pronunciation; validate each file's metadata and license." },
  { id: "aozora-bunko", name: "Aozora Bunko", type: "examples", url: "https://www.aozora.gr.jp/", notes: "Native-reading metadata; render only works whose current rights status qualifies." },
  { id: "tadoku", name: "Free Tadoku Books", type: "curriculum", url: "https://tadoku.org/japanese/en/free-books-en/", license: "CC BY-NC-ND 4.0", notes: "Unchanged provider-hosted graded reading; do not transform or generate add-on tests." },
  { id: "marugoto", name: "Japan Foundation Marugoto", type: "curriculum", url: "https://marugoto.jpf.go.jp/en/download/", notes: "Vocabulary and phrase progression reference; review terms before publishing derived content." },
  { id: "jfs-reading", name: "JFS Reading Activities", type: "curriculum", url: "https://www.kyozai.jpf.go.jp/kyozai/material/jfs/home/ja/render.do", notes: "Provider-hosted A1–A2 practical reading reference; do not turn source material into Kizashi assessment content." },
  { id: "kc-yom-yom", name: "KC Yom Yom", type: "examples", url: "https://www.jpf.go.jp/j/kansai/clip/yomyom/index.html", license: "CC BY-NC 2.1 Japan; verify individual asset terms", notes: "Provider-hosted extensive reading and optional audio; preserve asset attribution." },
  { id: "hirogaru", name: "Hirogaru", type: "examples", url: "https://www.hirogaru-nihongo.jpf.go.jp/en/", notes: "Provider-hosted interest-driven reading/video; source policy controls delivery." },
  { id: "ojad", name: "OJAD", type: "examples", url: "https://www.gavo.t.u-tokyo.ac.jp/ojad/eng/pages/home", notes: "Optional provider-hosted pronunciation, pitch-accent, and prosody reference; no mirrored data or audio." },
  { id: "tatoeba", name: "Tatoeba", type: "examples", url: "https://tatoeba.org/en/downloads", license: "CC BY 2.0 FR and per-contributor licenses", notes: "Example sentences require attribution and per-sentence license handling." },
  { id: "michi-curated-n5-seed", name: "Kizashi curated N5 seed", type: "curriculum", notes: "Original authored curriculum and examples." },
  { id: "michi-question-factory", name: "Kizashi question factory", type: "generated", notes: "Generated drills tied to curated item facts and validated before use." },
  { id: "user-draft", name: "Local user draft", type: "user", notes: "Unpublished content authored in Content Studio." },
];

export function getCurriculumBand(item: LearningItem): CurriculumBand {
  if (item.classification?.band) return item.classification.band;
  if (item.jlptLevel !== "N5") return "bridge";
  return item.difficulty <= 2 ? "core" : "extended";
}

export function classifyItem(item: LearningItem): CurriculumClassification | null {
  if (!item.jlptLevel) return null;
  if (item.classification) return item.classification;
  return {
    itemType: item.category,
    itemId: item.id,
    level: item.jlptLevel,
    band: getCurriculumBand(item),
    confidence: "medium",
    evidenceSources: item.sourceIds?.length ? item.sourceIds : ["michi-curated-n5-seed"],
    inclusionReason: item.jlptLevel === "N5" ? "Included for conservative N5 coverage." : "Included as bridge material for comprehension.",
    reviewedAt: "2026-08-29",
  };
}

function statusFor(coverage: number, accuracy: number, retention: number, sampleSize: number, timedAccuracy: number | null): ExamReadinessStatus {
  if (!sampleSize) return "untested";
  if (accuracy < 0.6 || coverage < 0.25) return "weak";
  if (coverage >= 0.7 && accuracy >= 0.85 && retention >= 0.7 && sampleSize >= 8 && timedAccuracy !== null && timedAccuracy >= 0.75) return "exam-ready";
  if (accuracy >= 0.75 && sampleSize >= 3) return "strong";
  return "developing";
}

function timedAccuracyFor(attempts: ExamAttempt[], skillType: LearningCategory) {
  return aggregateExamEvidence(attempts, [skillType]).ratio;
}

function sectionEvidence(attempts: ExamAttempt[], categories: LearningCategory[], minimumRatio: number) {
  const score = aggregateExamEvidence(attempts, categories);
  if (!score.total) return { correct: 0, total: 0, ratio: null, minimumRatio, status: "untested" as const };
  return { ...score, ratio: score.ratio ?? 0, minimumRatio, status: (score.ratio ?? 0) >= minimumRatio ? "above-minimum" as const : "below-minimum" as const };
}

export function getSkillMastery(items: LearningItem[], records: Record<string, ReviewRecord>, skillType: LearningCategory, examAttempts: ExamAttempt[] = []): ExamSkillMastery {
  const skillItems = items.filter((item) => item.category === skillType && item.jlptLevel === "N5");
  const reviewed = skillItems.filter((item) => records[item.id]);
  const reviewAttempts = reviewed.reduce((sum, item) => sum + records[item.id].attempts, 0);
  const correct = reviewed.reduce((sum, item) => sum + records[item.id].correct, 0);
  const retained = reviewed.filter((item) => records[item.id].masteryState === "stable" || records[item.id].masteryState === "strong" || records[item.id].streak >= 2).length;
  const coverage = reviewed.length / Math.max(skillItems.length, 1);
  const recentAccuracy = correct / Math.max(reviewAttempts, 1);
  const retention = retained / Math.max(reviewed.length, 1);
  const timedAccuracy = timedAccuracyFor(examAttempts, skillType);

  return {
    level: "N5",
    skillType,
    coverage,
    recentAccuracy,
    timedAccuracy,
    retention,
    sampleSize: reviewAttempts,
    status: statusFor(coverage, recentAccuracy, retention, reviewAttempts, timedAccuracy),
  };
}

export function getN5Readiness(items: LearningItem[], records: Record<string, ReviewRecord>, examAttempts: ExamAttempt[] = []) {
  const skillTypes: LearningCategory[] = ["vocabulary", "kanji", "grammar", "reading", "listening"];
  const attempts = [...examAttempts].sort((left, right) => right.completedAt - left.completedAt);
  const skills = skillTypes.map((skillType) => getSkillMastery(items, records, skillType, attempts));
  const sections = [
    { id: "language-knowledge-reading", label: "Language Knowledge + Reading", ...sectionEvidence(attempts, ["vocabulary", "kanji", "grammar", "reading"], n5ExamRequirements.languageReadingMinimum / n5ExamRequirements.languageReadingMaximum) },
    { id: "listening", label: "Listening", ...sectionEvidence(attempts, ["listening"], n5ExamRequirements.listeningMinimum / n5ExamRequirements.listeningMaximum) },
  ];
  const priority = chooseReadinessPriority(skills, sections) as ExamSkillMastery;
  const ready = skills.every((skill) => skill.status === "exam-ready") && sections.every((section) => section.status === "above-minimum");

  return {
    level: "N5" as const,
    ready,
    label: ready ? "Exam-ready" : "Not yet exam-ready",
    summary: ready ? "Every required skill has a meaningful, recent safety margin." : `Build your safety margin in ${priority.skillType} before relying on this score.`,
    priority,
    skills,
    sections,
  };
}
