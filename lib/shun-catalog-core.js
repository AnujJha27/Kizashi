function decodeXml(value) {
  return String(value ?? "").replace(/&amp;/gu, "&").replace(/&quot;/gu, '"').replace(/&#39;/gu, "'").replace(/&lt;/gu, "<").replace(/&gt;/gu, ">");
}

function tagValue(entry, tag) {
  const match = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "u").exec(entry);
  return match ? decodeXml(match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/u, "$1").trim()) : "";
}

function videoId(entry) {
  const direct = tagValue(entry, "yt:videoId");
  if (/^[A-Za-z0-9_-]{6,20}$/u.test(direct)) return direct;
  const id = tagValue(entry, "id").replace(/^yt:video:/u, "");
  return /^[A-Za-z0-9_-]{6,20}$/u.test(id) ? id : "";
}

function levelFromTitle(title) {
  const match = /N[45](?:-N[1-5])?/iu.exec(title);
  return match ? match[0].toUpperCase() : "N5–N4";
}

export function parseShunVideoFeed(xml) {
  return [...String(xml ?? "").matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gu)].flatMap(([, entry]) => {
    const id = videoId(entry);
    const title = tagValue(entry, "title");
    if (!id || !title) return [];
    const publishedAt = tagValue(entry, "published");
    return [{ id, title, level: levelFromTitle(title), publishedAt, url: `https://www.youtube.com/watch?v=${id}`, frameUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0`, posterUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` }];
  });
}

export function rotateCatalog(catalog, offset = 0) {
  const values = Array.isArray(catalog) ? catalog : [];
  if (!values.length) return [];
  const index = ((Number(offset) || 0) % values.length + values.length) % values.length;
  return [...values.slice(index), ...values.slice(0, index)];
}
