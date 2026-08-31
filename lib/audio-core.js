export function preferredJapaneseVoice(voices) {
  return voices.find((voice) => typeof voice?.lang === "string" && voice.lang.toLowerCase().startsWith("ja")) ?? null;
}
