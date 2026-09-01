const AOZORA_ORIGIN = "https://www.aozora.gr.jp";

function parseCsvRows(input) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') { cell += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") { row.push(cell); cell = ""; }
    else if (character === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (character !== "\r") cell += character;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((current) => current.some((value) => value.trim()));
}

function valueFor(record, names) {
  for (const name of names) {
    const value = record[name]?.trim();
    if (value) return value;
  }
  return "";
}

function absoluteUrl(value) {
  if (!value) return undefined;
  try {
    const url = new URL(value, AOZORA_ORIGIN);
    return url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function rightsStatus(marker) {
  if (/著作権存続|保護|protected|copyright\s+reserved|作業中/iu.test(marker)) return "protected";
  if (/著作権消滅|public\s*domain|expired|reusable/iu.test(marker)) return "public-domain";
  return "unknown";
}

function rightsMarkerFor(record) {
  const explicit = Object.entries(record)
    .filter(([key]) => /権利|著作権|copyright|rights|備考|remarks|notes?/iu.test(key))
    .map(([, value]) => value.trim())
    .filter(Boolean);
  const status = valueFor(record, ["状態", "status"]);
  if (status && /著作権|copyright|rights|protected|public\s*domain|expired|reusable/iu.test(status)) explicit.push(status);
  return explicit.join(" ") || status;
}

export function parseAozoraCatalog(input) {
  const rows = parseCsvRows(input);
  if (!rows.length) return [];
  const headers = rows[0].map((value) => value.replace(/^\uFEFF/u, "").trim());
  return rows.slice(1).map((values) => {
    const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    const workId = valueFor(record, ["作品ID", "作品 Id", "workId"]);
    const personId = valueFor(record, ["人物ID", "人物 Id", "personId"]);
    const title = valueFor(record, ["作品名", "title"]);
    const author = valueFor(record, ["著者名", "作者名", "author"]);
    const rightsMarker = rightsMarkerFor(record);
    if (!workId || !personId || !title) return null;
    const cardUrl = absoluteUrl(valueFor(record, ["カードURL", "図書カードURL", "cardUrl"])) ?? `${AOZORA_ORIGIN}/cards/${personId.padStart(6, "0")}/card${workId}.html`;
    const textUrl = absoluteUrl(valueFor(record, ["テキストURL", "テキストファイルURL", "textUrl"]));
    return {
      workId,
      personId,
      title,
      author,
      cardUrl,
      ...(textUrl ? { textUrl } : {}),
      orthography: valueFor(record, ["文字遣い", "仮名遣い", "orthography"]) || undefined,
      rightsMarker,
      rightsStatus: rightsStatus(rightsMarker),
    };
  }).filter(Boolean);
}

export function isReusableAozoraWork(work) {
  return work?.rightsStatus === "public-domain";
}

function decodeEntities(value) {
  return value.replace(/&#(x[\da-f]+|\d+);/giu, (_, code) => String.fromCodePoint(Number(code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : code))).replace(/&nbsp;/giu, " ").replace(/&amp;/giu, "&").replace(/&lt;/giu, "<").replace(/&gt;/giu, ">").replace(/&quot;/giu, '"');
}

function declaredCharset(response, bytes) {
  const contentType = typeof response.headers?.get === "function" ? response.headers.get("content-type") ?? "" : "";
  const headerCharset = contentType.match(/charset\s*=\s*["']?([\w-]+)/iu)?.[1];
  if (headerCharset) return headerCharset;
  const preview = new TextDecoder("ascii").decode(bytes.slice(0, 8192));
  return preview.match(/charset\s*=\s*["']?([\w-]+)/iu)?.[1] ?? "";
}

function decodeAozoraBytes(bytes, response) {
  const charset = declaredCharset(response, bytes).toLowerCase().replaceAll("_", "-");
  if (charset.includes("shift") || charset === "cp932" || charset === "ms932") return new TextDecoder("shift_jis").decode(bytes);
  if (charset.includes("utf-8") || charset === "utf8") return new TextDecoder("utf-8").decode(bytes);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("shift_jis").decode(bytes);
  }
}

export function normalizeAozoraText(input) {
  let text = String(input ?? "").replace(/<head\b[^>]*>[\s\S]*?<\/head>/giu, "").replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, "");
  text = text.replace(/<ruby\b[^>]*>([\s\S]*?)<\/ruby>/giu, (_, inner) => {
    const reading = inner.match(/<rt\b[^>]*>([\s\S]*?)<\/rt>/iu)?.[1];
    const base = inner.replace(/<rt\b[^>]*>[\s\S]*?<\/rt>/giu, "").replace(/<rp\b[^>]*>[\s\S]*?<\/rp>/giu, "").replace(/<[^>]+>/gu, "");
    return `${base}${reading ? `（${reading.replace(/<[^>]+>/gu, "")}）` : ""}`;
  });
  text = text.replace(/<br\s*\/?>/giu, "\n").replace(/<\/(?:p|div|li|h[1-6]|section|article)>/giu, "\n").replace(/<[^>]+>/gu, "");
  text = decodeEntities(text).replace(/｜([^《\n]+)《([^》\n]+)》/gu, "$1（$2）").replace(/([一-龯々ヶー]+)《([^》\n]+)》/gu, "$1（$2）").replace(/［＃[^］]*］/gu, "").replace(/｜/gu, "");
  return text.replace(/\r\n?/gu, "\n").replace(/[ \t]+\n/gu, "\n").replace(/\n{3,}/gu, "\n\n").trim();
}

export async function fetchAozoraText(work, fetcher = fetch) {
  if (!isReusableAozoraWork(work)) throw new Error("This Aozora work is protected or not marked reusable.");
  if (!work.textUrl) throw new Error("This Aozora work has no text URL.");
  const response = await fetcher(work.textUrl, { headers: { accept: "text/html,text/plain" } });
  if (!response.ok) throw new Error(`Aozora source returned ${response.status}.`);
  const sourceText = typeof response.arrayBuffer === "function"
    ? decodeAozoraBytes(new Uint8Array(await response.arrayBuffer()), response)
    : await response.text();
  return normalizeAozoraText(sourceText);
}

function uniqueMatches(text, pattern) {
  return new Set(text.match(pattern) ?? []);
}

export function estimateAozoraDifficulty(text, { vocabulary = [], kanji = [] } = {}) {
  const source = String(text ?? "");
  const characterCount = Array.from(source.replace(/\s/gu, "")).length;
  const sentenceCount = Math.max(1, (source.match(/[。！？!?]/gu) ?? []).length);
  const vocabularyCandidates = uniqueMatches(source, /[一-龯々ぁ-んァ-ヶー]+/gu);
  const knownVocabulary = new Set(vocabulary.filter((item) => item?.writtenForm && source.includes(item.writtenForm)).map((item) => item.writtenForm));
  const sourceKanji = uniqueMatches(source, /[一-龯々]/gu);
  const knownKanji = new Set(kanji.filter((item) => item?.character && sourceKanji.has(item.character)).map((item) => item.character));
  const vocabularyCoverage = knownVocabulary.size / Math.max(vocabularyCandidates.size, knownVocabulary.size, 1);
  const kanjiCoverage = knownKanji.size / Math.max(sourceKanji.size, 1);
  const averageSentenceLength = characterCount / sentenceCount;
  const difficultyBand = averageSentenceLength > 45 || vocabularyCoverage < 0.35 || kanjiCoverage < 0.5 ? "high" : averageSentenceLength > 24 || vocabularyCoverage < 0.65 ? "medium" : "approachable";
  return {
    label: "estimated",
    difficultyBand,
    characterCount,
    sentenceCount,
    averageSentenceLength,
    knownVocabularyCount: knownVocabulary.size,
    vocabularyCandidateCount: vocabularyCandidates.size,
    vocabularyCoverage,
    knownKanjiCount: knownKanji.size,
    kanjiCount: sourceKanji.size,
    kanjiCoverage,
  };
}
