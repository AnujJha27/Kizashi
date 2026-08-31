const API_URL = "https://en.wikibooks.org/w/api.php";
const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_CACHE_ENTRIES = 128;
const defaultCache = new Map();

function normalize(value) {
  return typeof value === "string" ? value.normalize("NFKC").trim() : "";
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

function pageUrl(page) {
  return `https://en.wikibooks.org/wiki/${encodeURI(page.replaceAll(" ", "_"))}`;
}

function sectionText(markup, section) {
  if (!section) return markup;
  const marker = `== ${section} ==`;
  const matchIndex = markup.indexOf(marker);
  if (matchIndex < 0) return markup;
  const contentStart = matchIndex + marker.length;
  const next = /^={2,6}/mu.exec(markup.slice(contentStart));
  return markup.slice(contentStart, next ? contentStart + next.index : undefined);
}

function sanitized(markup, page) {
  const links = [];
  let text = String(markup ?? "").replace(/<!--[\s\S]*?-->/gu, "").replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/giu, "");
  text = text.replace(/\[\[([^\]]+)\]\]|\[(https?:\/\/\S+)\s+([^\]]+)\]/gu, (_whole, internal, externalUrl, externalLabel) => {
    if (internal) {
      const [target, label = target] = internal.split("|");
      if (target && !target.startsWith("#")) links.push({ label: label.trim(), url: pageUrl(target.trim()) });
      return label.trim();
    }
    links.push({ label: externalLabel.trim(), url: externalUrl });
    return externalLabel.trim();
  });
  text = text.replace(/\{\{[^{}]*\}\}/gu, "").replace(/<[^>]+>/gu, "").replace(/'{2,5}/gu, "").replace(/^\s*[|!*#;:].*$/gmu, "").replace(/\n{3,}/gu, "\n\n").trim();
  return { text, links };
}

function wikitextValue(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof value["*"] === "string") return value["*"];
  return "";
}

async function requestJson(fetchImpl, url) {
  const response = await fetchImpl(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Wikibooks returned HTTP ${response.status}.`);
  return response.json();
}

export async function getWikibooksSection(lookup, options = {}) {
  const page = normalize(lookup?.page);
  const section = normalize(lookup?.section);
  if (!page || page.length > 180 || section.length > 120 || /[\u0000-\u001f]/u.test(`${page}${section}`)) throw new Error("Invalid Wikibooks reference.");
  const cache = options.cache ?? defaultCache;
  const key = `${page}\u0000${section}`;
  const cached = cacheRead(cache, key);
  if (cached !== undefined) return cached;
  const url = new URL(API_URL);
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", page);
  url.searchParams.set("prop", "wikitext|sections");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  const payload = await requestJson(options.fetch ?? fetch, url);
  const parsed = payload?.parse;
  if (!parsed) {
    cacheWrite(cache, key, null);
    return null;
  }
  const markup = sectionText(wikitextValue(parsed.wikitext), section);
  const clean = sanitized(markup, page);
  const result = {
    title: typeof parsed.title === "string" ? parsed.title : page,
    section: section || undefined,
    text: clean.text,
    links: clean.links,
    sourceUrl: pageUrl(page),
    attribution: "Wikibooks contributors",
    license: "CC BY-SA 4.0 / GFDL",
  };
  cacheWrite(cache, key, result);
  return result;
}
