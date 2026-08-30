function text(value) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function key(value) {
  return text(value).normalize("NFKC").toLocaleLowerCase();
}

function idPart(value, fallback = "") {
  return key(value).replace(/\s+/gu, "-") || fallback;
}

function parseCsv(raw) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < raw.length; index += 1) {
    const character = raw[index];
    if (character === '"') {
      if (quoted && raw[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && raw[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  const headers = (rows.shift() ?? []).map((value) => key(value).replace(/[^a-z0-9]+/gu, ""));
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function parseRows(raw) {
  try {
    const value = JSON.parse(raw);
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object" && Array.isArray(value.entries)) return value.entries;
  } catch {
    return parseCsv(raw);
  }
  return [];
}

function field(row, names) {
  for (const name of names) {
    const value = row[name] ?? row[key(name).replace(/[^a-z0-9]+/gu, "")];
    if (text(value)) return text(value);
  }
  return "";
}

function canonicalId(writtenForm, reading, canonicalItems) {
  const written = key(writtenForm);
  const kana = key(reading);
  const match = canonicalItems.find((item) => {
    if (item.category && item.category !== "vocabulary") return false;
    if (key(item.writtenForm) !== written) return false;
    return !kana || key(item.reading) === kana;
  });
  return match?.id;
}

function parseEntry(row, index, canonicalItems) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return { error: `Row ${index + 1} must be an object.` };
  const writtenForm = field(row, ["japanese", "writtenForm", "word", "term"]);
  const meaning = field(row, ["meaning", "meanings", "gloss", "translation"]);
  if (!writtenForm || !meaning) return { error: `Row ${index + 1} needs Japanese and meaning.` };
  const reading = field(row, ["reading", "kana"]);
  const sentence = field(row, ["sentence", "example", "exampleSentence"]);
  const sourceLabel = field(row, ["source", "sourceLabel", "book", "textbook"]);
  const lesson = field(row, ["lesson", "chapter"]);
  const page = field(row, ["page", "pageNumber"]);
  const sourceId = idPart(sourceLabel, "list");
  const id = `personal-${sourceId}-${writtenForm}-${reading}-${lesson}${page ? `-${page}` : ""}`;
  const matchedCanonicalId = canonicalId(writtenForm, reading, canonicalItems);
  return {
    entry: {
      id,
      writtenForm,
      reading,
      meaning,
      sentence,
      sourceLabel,
      lesson,
      page,
      ...(matchedCanonicalId ? { canonicalItemId: matchedCanonicalId } : {}),
    },
  };
}

export function importPersonalEntries(raw, canonicalItems = []) {
  if (typeof raw !== "string" || !raw.trim()) return { entries: [], errors: ["Add a CSV or JSON list first."] };
  const rows = parseRows(raw);
  if (!rows.length) return { entries: [], errors: ["The list has no readable rows."] };
  const entries = [];
  const errors = [];
  rows.forEach((row, index) => {
    const result = parseEntry(row, index, canonicalItems);
    if (result.error) errors.push(result.error);
    else entries.push(result.entry);
  });
  return { entries, errors };
}
