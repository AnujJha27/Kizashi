const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_CACHE_ENTRIES = 256;
const defaultCache = new Map();

export function normalizeCommonsText(value) {
  return typeof value === "string" ? value.normalize("NFKC").trim().replace(/\s+/gu, " ") : "";
}

function metadataValue(metadata, ...keys) {
  for (const key of keys) {
    const value = metadata?.[key];
    const text = typeof value === "object" && value !== null ? value.value : value;
    if (typeof text === "string" && text.trim()) return text.trim();
  }
  return "";
}

function metadataValues(metadata, ...keys) {
  return keys.flatMap((key) => {
    const value = metadata?.[key];
    const text = typeof value === "object" && value !== null ? value.value : value;
    return typeof text === "string" && text.trim() ? [text.trim()] : [];
  });
}

function cacheRead(cache, key) {
  const entry = cache.get(key);
  if (entry === undefined) return undefined;
  if (entry && typeof entry === "object" && "expiresAt" in entry) {
    if (entry.expiresAt <= Date.now()) {
      cache.delete(key);
      return undefined;
    }
    return entry.value;
  }
  return entry;
}

function cacheWrite(cache, key, value) {
  if (cache.size >= MAX_CACHE_ENTRIES && !cache.has(key)) cache.delete(cache.keys().next().value);
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function validHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function escaped(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function filenameStem(title) {
  return normalizeCommonsText(title.replace(/^File:/iu, "").replace(/\.(?:oga|ogg|mp3|wav|m4a|flac)$/iu, ""));
}

function filenameHasTerm(title, term) {
  const filename = filenameStem(title);
  if (!filename || !term) return false;
  if (filename === term) return true;
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped(term)}(?=$|[^\\p{L}\\p{N}])`, "u").test(filename);
}

function ambiguousLabel(metadata, terms) {
  return ["ObjectName", "Label"].some((key) => {
    const value = metadataValue(metadata, key);
    return terms.some((term) => value.includes(term) && normalizeCommonsText(value) !== term && /[/|,;]|\s+or\s+/iu.test(value));
  });
}

function compatibleLicense(value, acceptedLicenses) {
  const normalized = normalizeCommonsText(value).toLowerCase().replace(/[\s_-]+/gu, " ");
  if (!normalized || /unknown|all rights reserved|no license/iu.test(normalized)) return false;
  let license = "";
  if (/public domain|pdm/iu.test(normalized)) license = "public-domain";
  else if (/^cc0(?:\s|$)/iu.test(normalized)) license = "cc0";
  else if (/^cc by(?:\s|$)/iu.test(normalized)) {
    const features = ["nc", "nd", "sa"].filter((feature) => new RegExp(`\\b${feature}\\b`, "u").test(normalized));
    license = `cc-by${features.length ? `-${features.join("-")}` : ""}`;
  }
  if (!license) return false;
  const accepted = acceptedLicenses?.map((entry) => {
    const value = String(entry);
    return compatibleLicense(value) ? compatibleLicenseCode(value) : "";
  }).filter(Boolean);
  return (accepted?.length ? accepted : ["public-domain", "cc0", "cc-by", "cc-by-sa", "cc-by-nc", "cc-by-nd", "cc-by-nc-sa", "cc-by-nc-nd"]).includes(license);
}

function compatibleLicenseCode(value) {
  const normalized = normalizeCommonsText(value).toLowerCase().replace(/[\s_-]+/gu, " ");
  if (/public domain|pdm/iu.test(normalized)) return "public-domain";
  if (/^cc0(?:\s|$)/iu.test(normalized)) return "cc0";
  if (!/^cc by(?:\s|$)/iu.test(normalized)) return "";
  const features = ["nc", "nd", "sa"].filter((feature) => new RegExp(`\\b${feature}\\b`, "u").test(normalized));
  return `cc-by${features.length ? `-${features.join("-")}` : ""}`;
}

function collectionFor(title, metadata) {
  const category = metadataValue(metadata, "Categories", "Category", "Collection");
  return /lingua libre/iu.test(category) ? "lingua-libre" : "commons";
}

function hasJapaneseEvidence(metadata) {
  const evidence = metadataValues(metadata, "Categories", "Category", "Language", "ContentLanguage", "Collection", "Description").join(" ");
  return /japanese|日本語|\bjpn\b|\bja(?:-jp)?\b/iu.test(evidence);
}

function pagesFrom(payload) {
  const pages = payload?.query?.pages;
  return Array.isArray(pages) ? pages : Object.values(pages ?? {});
}

async function json(fetchImpl, url) {
  const response = await fetchImpl(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Wikimedia Commons returned HTTP ${response.status}.`);
  return response.json();
}

async function searchTitles(term, fetchImpl) {
  const url = new URL(COMMONS_API);
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srnamespace", "6");
  url.searchParams.set("srsearch", `"${term.replaceAll('"', "")}"`);
  url.searchParams.set("srlimit", "20");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  const payload = await json(fetchImpl, url);
  return Array.isArray(payload?.query?.search) ? payload.query.search.map((entry) => entry?.title).filter((title) => typeof title === "string") : [];
}

async function imageInfo(titles, fetchImpl) {
  if (!titles.length) return [];
  const url = new URL(COMMONS_API);
  url.searchParams.set("action", "query");
  url.searchParams.set("titles", titles.join("|"));
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|mime|extmetadata|user");
  url.searchParams.set("iilimit", "1");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  const payload = await json(fetchImpl, url);
  return pagesFrom(payload);
}

function matchScore(page, searchRanks, text, reading) {
  const info = page?.imageinfo?.[0];
  if (!info || typeof page.title !== "string" || !/^audio\//iu.test(String(info.mime ?? ""))) return null;
  const metadata = info.extmetadata ?? {};
  const terms = [text, reading].filter(Boolean);
  if (!hasJapaneseEvidence(metadata)) return null;
  if (ambiguousLabel(metadata, terms)) return null;

  const exactTextLabel = normalizeCommonsText(metadataValue(metadata, "ObjectName", "Label")) === text;
  const exactReadingLabel = reading && normalizeCommonsText(metadataValue(metadata, "ObjectName", "Label")) === reading;
  const exactTextFilename = filenameHasTerm(page.title, text);
  const exactReadingFilename = reading && filenameHasTerm(page.title, reading);
  const score = exactTextLabel ? 100 : exactReadingLabel ? 90 : exactTextFilename ? 80 : exactReadingFilename ? 70 : 0;
  if (!score) return null;
  return { page, info, metadata, score };
}

function resultFrom(match, text) {
  const { page, info, metadata } = match;
  const license = metadataValue(metadata, "LicenseShortName", "UsageTerms", "License");
  const title = page.title.replace(/^File:/iu, "");
  const filePage = validHttpUrl(info.descriptionurl) || `https://commons.wikimedia.org/wiki/${encodeURI(page.title.replaceAll(" ", "_"))}`;
  const speaker = metadataValue(metadata, "Speaker", "SpeakerName", "VoiceActor");
  const speakerId = metadataValue(metadata, "SpeakerID", "SpeakerId");
  const uploader = typeof info.user === "string" && info.user.trim() ? info.user.trim() : "";
  const attribution = metadataValue(metadata, "Credit", "Artist", "Attribution", "Creator") || (uploader ? `Uploaded by ${uploader}` : "");
  const licenseUrl = validHttpUrl(metadataValue(metadata, "LicenseUrl", "LicenseURL")) || undefined;
  const audioUrl = validHttpUrl(info.url);
  if (!audioUrl || !filePage || !license) return null;
  return {
    url: audioUrl,
    filePage,
    label: text,
    ...(speaker ? { speaker } : {}),
    ...(speakerId ? { speakerId } : {}),
    license,
    ...(licenseUrl ? { licenseUrl } : {}),
    ...(attribution ? { attribution } : {}),
    source: "wikimedia-commons",
    collection: collectionFor(page.title, metadata),
  };
}

export async function resolveCommonsAudio(lookup, options = {}) {
  const text = normalizeCommonsText(lookup?.text);
  const reading = normalizeCommonsText(lookup?.reading);
  if (!text) return null;
  const key = `${text}\u0000${reading}`;
  const cache = options.cache ?? defaultCache;
  const cached = cacheRead(cache, key);
  if (cached !== undefined) return cached;
  const fetchImpl = options.fetch ?? fetch;
  const terms = [...new Set([text, reading].filter(Boolean))];
  const searchRanks = new Map();
  for (let index = 0; index < terms.length; index += 1) {
    for (const title of await searchTitles(terms[index], fetchImpl)) searchRanks.set(title, Math.max(searchRanks.get(title) ?? 0, terms.length - index));
  }
  if (!searchRanks.size) {
    cacheWrite(cache, key, null);
    return null;
  }
  const pages = await imageInfo([...searchRanks.keys()], fetchImpl);
  const matches = pages.map((page) => matchScore(page, searchRanks, text, reading)).filter(Boolean).filter((match) => compatibleLicense(metadataValue(match.metadata, "LicenseShortName", "UsageTerms", "License"), options.acceptedLicenses));
  matches.sort((left, right) => right.score - left.score);
  const result = matches.length ? resultFrom(matches[0], text) : null;
  cacheWrite(cache, key, result);
  return result;
}
