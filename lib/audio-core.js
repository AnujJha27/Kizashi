export function preferredJapaneseVoice(voices) {
  return voices.find((voice) => typeof voice?.lang === "string" && voice.lang.toLowerCase().startsWith("ja")) ?? null;
}

export function shouldFallbackToBrowser({ sourceType, status, text }) {
  return sourceType === "remote" && status === "error" && typeof text === "string" && Boolean(text.trim());
}

export function audioSourceInfo(providerType, metadata) {
  if (providerType !== "remote" || metadata?.provenance?.sourceId !== "wikimedia-commons") return null;
  const provenance = metadata.provenance;
  return {
    label: provenance.collection === "lingua-libre" ? "Human recording · Lingua Libre" : "Human recording · Wikimedia Commons",
    filePage: typeof provenance.sourceUrl === "string" ? provenance.sourceUrl : undefined,
    attribution: typeof provenance.attribution === "string" ? provenance.attribution : undefined,
    license: typeof metadata.license === "string" ? metadata.license : undefined,
  };
}
