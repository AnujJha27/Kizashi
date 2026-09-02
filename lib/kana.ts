export type KanaScript = "hiragana" | "katakana";

export type KanaCard = { kana: string; romaji: string };

export const kanaAliases: Record<string, string[]> = { "ぢ": ["di"], "づ": ["du"] };

export const kanaRows: Array<[string | string[], string[]]> = [
  ["あいうえお", ["a", "i", "u", "e", "o"]],
  ["かきくけこ", ["ka", "ki", "ku", "ke", "ko"]],
  ["さしすせそ", ["sa", "shi", "su", "se", "so"]],
  ["たちつてと", ["ta", "chi", "tsu", "te", "to"]],
  ["なにぬねの", ["na", "ni", "nu", "ne", "no"]],
  ["はひふへほ", ["ha", "hi", "fu", "he", "ho"]],
  ["まみむめも", ["ma", "mi", "mu", "me", "mo"]],
  ["やゆよ", ["ya", "yu", "yo"]],
  ["らりるれろ", ["ra", "ri", "ru", "re", "ro"]],
  ["わをん", ["wa", "wo", "n"]],
  ["がぎぐげご", ["ga", "gi", "gu", "ge", "go"]],
  ["ざじずぜぞ", ["za", "ji", "zu", "ze", "zo"]],
  ["だぢづでど", ["da", "ji", "zu", "de", "do"]],
  ["ばびぶべぼ", ["ba", "bi", "bu", "be", "bo"]],
  ["ぱぴぷぺぽ", ["pa", "pi", "pu", "pe", "po"]],
  [["きゃ", "きゅ", "きょ"], ["kya", "kyu", "kyo"]],
  [["しゃ", "しゅ", "しょ"], ["sha", "shu", "sho"]],
  [["ちゃ", "ちゅ", "ちょ"], ["cha", "chu", "cho"]],
  [["にゃ", "にゅ", "にょ"], ["nya", "nyu", "nyo"]],
  [["ひゃ", "ひゅ", "ひょ"], ["hya", "hyu", "hyo"]],
  [["みゃ", "みゅ", "みょ"], ["mya", "myu", "myo"]],
  [["りゃ", "りゅ", "りょ"], ["rya", "ryu", "ryo"]],
  [["ぎゃ", "ぎゅ", "ぎょ"], ["gya", "gyu", "gyo"]],
  [["じゃ", "じゅ", "じょ"], ["ja", "ju", "jo"]],
  [["びゃ", "びゅ", "びょ"], ["bya", "byu", "byo"]],
  [["ぴゃ", "ぴゅ", "ぴょ"], ["pya", "pyu", "pyo"]],
];

export function kanaRowCharacters(characters: string | string[]) {
  return Array.isArray(characters) ? characters : [...characters];
}

export const hiraganaCards: KanaCard[] = kanaRows.flatMap(([characters, sounds]) => kanaRowCharacters(characters).map((kana, index) => ({ kana, romaji: sounds[index] })));

export function toKatakana(value: string) {
  return [...value].map((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint >= 0x3041 && codePoint <= 0x3096 ? String.fromCodePoint(codePoint + 0x60) : character;
  }).join("");
}

export const katakanaCards: KanaCard[] = hiraganaCards.map(({ kana, romaji }) => ({ kana: toKatakana(kana), romaji }));

export function kanaRomajiLabel(kana: string, romaji: string) {
  const hiragana = [...kana].map((character) => { const codePoint = character.codePointAt(0) ?? 0; return codePoint >= 0x30a1 && codePoint <= 0x30f6 ? String.fromCodePoint(codePoint - 0x60) : character; }).join("");
  return [romaji, ...(kanaAliases[hiragana] ?? [])].join(" / ");
}

export function kanaCardsFor(script: KanaScript) {
  return script === "hiragana" ? hiraganaCards : katakanaCards;
}
