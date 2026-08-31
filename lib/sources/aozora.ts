import * as core from "./aozora-core.js";

export interface AozoraWork {
  workId: string;
  personId: string;
  title: string;
  author?: string;
  cardUrl: string;
  textUrl?: string;
  orthography?: string;
  rightsMarker: string;
  rightsStatus: "public-domain" | "protected" | "unknown";
}

export interface AozoraEstimate {
  label: "estimated";
  difficultyBand: "high" | "medium" | "approachable";
  characterCount: number;
  sentenceCount: number;
  averageSentenceLength: number;
  knownVocabularyCount: number;
  vocabularyCandidateCount: number;
  vocabularyCoverage: number;
  knownKanjiCount: number;
  kanjiCount: number;
  kanjiCoverage: number;
}

export function parseAozoraCatalog(input: string): AozoraWork[] {
  return core.parseAozoraCatalog(input) as AozoraWork[];
}

export function isReusableAozoraWork(work: Partial<AozoraWork>): boolean {
  return core.isReusableAozoraWork(work);
}

export function normalizeAozoraText(input: string): string {
  return core.normalizeAozoraText(input);
}

export function fetchAozoraText(work: AozoraWork): Promise<string> {
  return core.fetchAozoraText(work) as Promise<string>;
}

export function estimateAozoraDifficulty(text: string, options: { vocabulary?: readonly { writtenForm?: string }[]; kanji?: readonly { character?: string }[] } = {}): AozoraEstimate {
  return core.estimateAozoraDifficulty(text, options as never) as AozoraEstimate;
}
