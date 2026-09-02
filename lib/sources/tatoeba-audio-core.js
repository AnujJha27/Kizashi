const TATOEBA_API = "https://api.tatoeba.org/v1/sentences";
const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_CACHE_ENTRIES = 256;
const defaultCache = new Map();

function text(value) {
  return typeof value === "string" ? value.normalize("NFKC").trim().replace(/\s+/gu, " ") : "";
}

function httpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
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

function usableLicense(value) {
  const license = text(value);
  return license === "CC0 1.0" || license === "CC BY 2.0 FR" ? license : "";
}

function sentencesFrom(payload) {
  return Array.isArray(payload?.data) ? payload.data : [];
}

function audioResult(sentence, audio, requestedText) {
  const license = usableLicense(audio?.licence ?? audio?.license);
  const url = httpsUrl(audio?.download_url) || (Number.isInteger(audio?.id) ? `https://api.tatoeba.org/v1/audios/${audio.id}/file` : "");
  const sentenceId = Number.isInteger(sentence?.id) ? sentence.id : undefined;
  const author = text(audio?.author);
  if (!license || !url || !sentenceId) return null;
  const filePage = `https://tatoeba.org/en/sentences/show/${sentenceId}`;
  return {
    url,
    filePage,
    label: requestedText,
    ...(author ? { speaker: author } : {}),
    ...(author ? { attribution: `Tatoeba contributor: ${author}` } : {}),
    license,
    licenseUrl: license === "CC0 1.0" ? "https://creativecommons.org/publicdomain/zero/1.0/" : "https://creativecommons.org/licenses/by/2.0/fr/",
    source: "tatoeba",
    sentenceId,
  };
}

async function json(fetchImpl, url) {
  const response = await fetchImpl(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Tatoeba returned HTTP ${response.status}.`);
  return response.json();
}

export async function resolveTatoebaAudio(lookup, options = {}) {
  const requestedText = text(lookup?.text);
  if (!requestedText) return null;
  const cache = options.cache ?? defaultCache;
  const cached = cacheRead(cache, requestedText);
  if (cached !== undefined) return cached;
  const url = new URL(TATOEBA_API);
  url.searchParams.set("lang", "jpn");
  url.searchParams.set("q", requestedText);
  url.searchParams.set("has_audio", "yes");
  url.searchParams.set("is_unapproved", "no");
  url.searchParams.set("is_orphan", "no");
  url.searchParams.set("include", "audios");
  url.searchParams.set("sort", "relevance");
  url.searchParams.set("limit", "20");
  const payload = await json(options.fetch ?? fetch, url);
  const result = sentencesFrom(payload)
    .filter((sentence) => text(sentence?.text) === requestedText)
    .flatMap((sentence) => (Array.isArray(sentence?.audios) ? sentence.audios.map((audio) => audioResult(sentence, audio, requestedText)) : []))
    .find(Boolean) ?? null;
  cacheWrite(cache, requestedText, result);
  return result;
}
