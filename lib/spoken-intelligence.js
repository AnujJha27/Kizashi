function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function getSpokenFrequencySignal(item = {}) {
  const metadata = item.spokenFrequencyMetadata && typeof item.spokenFrequencyMetadata === "object" ? item.spokenFrequencyMetadata : {};
  return {
    value: positiveNumber(item.spokenFrequency),
    corpus: typeof metadata.corpus === "string" && metadata.corpus.trim() ? metadata.corpus.trim() : null,
    perMillion: positiveNumber(metadata.pmw),
  };
}

export function getConversationPriority(item = {}) {
  const signal = getSpokenFrequencySignal(item);
  if (signal.value === null) return 0;
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const conversationBonus = tags.some((tag) => typeof tag === "string" && ["conversation", "spoken", "listening"].includes(tag.toLowerCase())) ? 1 : 0;
  return Math.log1p(signal.value) * 2 + (signal.perMillion ? Math.log1p(signal.perMillion) : 0) + conversationBonus;
}

export function spokenSignalLabel(item = {}) {
  const signal = getSpokenFrequencySignal(item);
  return signal.value === null ? "No spoken-frequency signal" : `${signal.corpus ?? "Reviewed spoken"} signal`;
}
