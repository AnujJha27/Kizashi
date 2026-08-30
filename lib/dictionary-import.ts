import type { KanjiItem, VocabularyItem } from "@/lib/types";

export type DictionaryCandidate = VocabularyItem | KanjiItem;

function text(node: Element | null, selector: string) {
  return node?.querySelector(selector)?.textContent?.trim() ?? "";
}

function texts(node: Element, selector: string) {
  return [...node.querySelectorAll(selector)].map((entry) => entry.textContent?.trim() ?? "").filter(Boolean);
}

function priorityScore(values: string[]) {
  if (values.some((value) => /^(news1|ichi1|spec1|gai1)$/.test(value))) return 5;
  if (values.some((value) => /^(news2|ichi2|spec2|gai2)$/.test(value))) return 4;
  return values.length ? 3 : undefined;
}

function parseXml(raw: string) {
  const document = new DOMParser().parseFromString(raw, "application/xml");
  if (document.querySelector("parsererror")) throw new Error("The XML file could not be parsed.");
  return document;
}

export function parseJmdictXml(raw: string, query = "", limit = 12): VocabularyItem[] {
  const document = parseXml(raw);
  const normalizedQuery = query.trim().toLowerCase();
  return [...document.querySelectorAll("entry")].flatMap((entry) => {
    const writtenForms = texts(entry, "k_ele > keb");
    const readings = texts(entry, "r_ele > reb");
    const matches = !normalizedQuery || [...writtenForms, ...readings].some((value) => value.toLowerCase().includes(normalizedQuery));
    if (!matches) return [];
    const meanings = [...entry.querySelectorAll("sense > gloss")].filter((gloss) => !gloss.getAttribute("xml:lang") || gloss.getAttribute("xml:lang") === "eng").map((gloss) => gloss.textContent?.trim() ?? "").filter(Boolean).slice(0, 6);
    if (!writtenForms.length && !readings.length || !meanings.length) return [];
    const sequence = text(entry, "ent_seq") || String(Date.now());
    const writtenForm = writtenForms[0] ?? readings[0] ?? "";
    const reading = readings[0] ?? writtenForm;
    const priorities = [...texts(entry, "k_ele > ke_pri"), ...texts(entry, "r_ele > re_pri")];
    const pos = texts(entry, "sense > pos");
    return [{
      id: `jmdict-${sequence}`,
      slug: `jmdict-${sequence}`,
      title: writtenForm,
      jlptLevel: null,
      category: "vocabulary",
      subcategory: "dictionary import",
      difficulty: 2,
      prerequisiteIds: [],
      tags: ["dictionary-import"],
      sourceIds: ["jmdict"],
      fieldSourceIds: { writtenForm: ["jmdict"], reading: ["jmdict"], meanings: ["jmdict"], partOfSpeech: ["jmdict"] },
      writtenForm,
      reading,
      meanings,
      partOfSpeech: pos[0] ?? "dictionary entry",
      commonness: priorityScore(priorities),
      exampleSentences: [],
      collocations: [],
      relatedWords: [],
      antonyms: [],
      notes: pos.length ? `JMdict part-of-speech codes: ${pos.join(", ")}. Add a reviewed example before publishing.` : "Imported from JMdict. Add a reviewed example before publishing.",
    } satisfies VocabularyItem];
  }).slice(0, limit);
}

export function parseKanjidic2Xml(raw: string, query = "", limit = 12): KanjiItem[] {
  const document = parseXml(raw);
  const normalizedQuery = query.trim();
  return [...document.querySelectorAll("character")].flatMap((entry) => {
    const character = text(entry, "literal");
    if (!character || (normalizedQuery && !character.includes(normalizedQuery))) return [];
    const readings = [...entry.querySelectorAll("reading_meaning > rmgroup > reading")];
    const onyomi = readings.filter((reading) => reading.getAttribute("r_type") === "ja_on").map((reading) => reading.textContent?.trim() ?? "").filter(Boolean);
    const kunyomi = readings.filter((reading) => reading.getAttribute("r_type") === "ja_kun").map((reading) => reading.textContent?.trim() ?? "").filter(Boolean);
    const meanings = [...entry.querySelectorAll("reading_meaning > rmgroup > meaning")].filter((meaning) => !meaning.getAttribute("m_lang") || meaning.getAttribute("m_lang") === "en").map((meaning) => meaning.textContent?.trim() ?? "").filter(Boolean).slice(0, 6);
    if (!meanings.length) return [];
    const grade = text(entry, "misc > grade");
    const strokeCount = text(entry, "misc > stroke_count");
    const radical = text(entry, "radical > rad_value[r_type='classical']") || text(entry, "radical > rad_value");
    const nanori = texts(entry, "reading_meaning > nanori");
    return [{
      id: `kanjidic2-${character}`,
      slug: `kanjidic2-${character}`,
      title: character,
      jlptLevel: null,
      category: "kanji",
      subcategory: "dictionary import",
      difficulty: 2,
      prerequisiteIds: [],
      tags: ["dictionary-import"],
      sourceIds: ["kanjidic2"],
      fieldSourceIds: { character: ["kanjidic2"], meanings: ["kanjidic2"], onyomi: ["kanjidic2"], kunyomi: ["kanjidic2"], strokeCount: ["kanjidic2"], grade: ["kanjidic2"], radical: ["kanjidic2"], nanori: ["kanjidic2"] },
      character,
      meanings,
      onyomi,
      kunyomi,
      strokeCount: strokeCount ? Number(strokeCount) : undefined,
      grade: grade ? Number(grade) : undefined,
      radical: radical || undefined,
      nanori,
      usefulWords: [],
    } satisfies KanjiItem];
  }).slice(0, limit);
}
