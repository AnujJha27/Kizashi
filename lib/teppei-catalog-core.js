function decodeXml(value) {
  return String(value ?? "").replace(/&amp;/gu, "&").replace(/&quot;/gu, '"').replace(/&#39;/gu, "'").replace(/&lt;/gu, "<").replace(/&gt;/gu, ">");
}

function tagValue(entry, tag) {
  const match = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "u").exec(entry);
  return match ? decodeXml(match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/u, "$1").trim()) : "";
}

function attributeValue(entry, tag, attribute) {
  const match = new RegExp(`<${tag}\\b[^>]*\\b${attribute}=["']([^"']+)["'][^>]*>`, "u").exec(entry);
  return match ? decodeXml(match[1].trim()) : "";
}

function secureUrl(value) {
  try {
    const url = new URL(String(value ?? ""));
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    url.protocol = "https:";
    return url.href;
  } catch {
    return "";
  }
}

function publishedAt(value) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "" : date.toISOString();
}

export function parseTeppeiFeed(xml) {
  return [...String(xml ?? "").matchAll(/<(?:item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/(?:item|entry)>/gu)].flatMap(([, entry]) => {
    const title = tagValue(entry, "title");
    const mediaUrl = secureUrl(attributeValue(entry, "enclosure", "url"));
    if (!title || !mediaUrl) return [];
    const guid = tagValue(entry, "guid") || tagValue(entry, "id");
    const episode = tagValue(entry, "itunes:episode") || title.match(/#(\d+)/u)?.[1] || "";
    const id = guid || (episode ? `teppei-${episode}` : mediaUrl);
    return [{ id, title, publishedAt: publishedAt(tagValue(entry, "pubDate") || tagValue(entry, "published")), url: secureUrl(tagValue(entry, "link")) || "https://nihongoconteppei.com/", mediaUrl, duration: tagValue(entry, "itunes:duration") }];
  });
}

export function rotateCatalog(catalog, offset = 0) {
  const values = Array.isArray(catalog) ? catalog : [];
  if (!values.length) return [];
  const index = ((Number(offset) || 0) % values.length + values.length) % values.length;
  return [...values.slice(index), ...values.slice(0, index)];
}
