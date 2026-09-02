export function preferredJapaneseVoice(voices) {
  return voices.find((voice) => typeof voice?.lang === "string" && voice.lang.toLowerCase().startsWith("ja")) ?? null;
}

export function shouldFallbackToBrowser({ sourceType, status, text }) {
  return sourceType === "remote" && status === "error" && typeof text === "string" && Boolean(text.trim());
}

export function audioSourceInfo(providerType, metadata) {
  if (providerType !== "remote" || !["wikimedia-commons", "tatoeba"].includes(metadata?.provenance?.sourceId)) return null;
  const provenance = metadata.provenance;
  if (provenance.sourceId === "tatoeba") {
    return {
      label: "Human recording · Tatoeba",
      filePage: typeof provenance.sourceUrl === "string" ? provenance.sourceUrl : undefined,
      attribution: typeof provenance.attribution === "string" ? provenance.attribution : undefined,
      license: typeof metadata.license === "string" ? metadata.license : undefined,
    };
  }
  return {
    label: provenance.collection === "lingua-libre" ? "Human recording · Lingua Libre" : "Human recording · Wikimedia Commons",
    filePage: typeof provenance.sourceUrl === "string" ? provenance.sourceUrl : undefined,
    attribution: typeof provenance.attribution === "string" ? provenance.attribution : undefined,
    license: typeof metadata.license === "string" ? metadata.license : undefined,
  };
}
