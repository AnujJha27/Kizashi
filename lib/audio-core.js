export function preferredJapaneseVoice(voices) {
  return voices.find((voice) => typeof voice?.lang === "string" && voice.lang.toLowerCase().startsWith("ja")) ?? null;
}

export function shouldFallbackToBrowser({ sourceType, status, text }) {
  return sourceType === "remote" && status === "error" && typeof text === "string" && Boolean(text.trim());
}
