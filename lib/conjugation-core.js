const iRow = { "う": "い", "く": "き", "ぐ": "ぎ", "す": "し", "つ": "ち", "ぬ": "に", "ぶ": "び", "む": "み", "る": "り" };
const aRow = { "う": "わ", "く": "か", "ぐ": "が", "す": "さ", "つ": "た", "ぬ": "な", "ぶ": "ば", "む": "ま", "る": "ら" };

export function getConjugationForms(item) {
  const word = item?.writtenForm ?? "";
  if (!word) return {};
  if (/い-adjective/u.test(item.partOfSpeech ?? "") && word.endsWith("い")) {
    if (word === "いい") return { present: word, negative: "よくない", past: "よかった", pastNegative: "よくなかった" };
    const stem = word.slice(0, -1);
    return { present: word, negative: `${stem}くない`, past: `${stem}かった`, pastNegative: `${stem}くなかった` };
  }
  if (/な-adjective/u.test(item.partOfSpeech ?? "")) return { present: `${word}です`, negative: `${word}ではありません`, past: `${word}でした`, pastNegative: `${word}ではありませんでした`, modifier: `${word}な` };
  if (!/verb/u.test(item.partOfSpeech ?? "")) return {};
  if (word === "来る") return { dictionary: word, politeNonPast: "来ます", politeNegative: "来ません", politePast: "来ました", politePastNegative: "来ませんでした", te: "来て", nai: "来ない", ta: "来た", tai: "来たい" };
  if (word === "ある") return { dictionary: word, politeNonPast: "あります", politeNegative: "ありません", politePast: "ありました", politePastNegative: "ありませんでした", te: "あって", nai: "ない", ta: "あった", tai: "ありたい" };
  if (word.endsWith("する") || /する verb/u.test(item.partOfSpeech ?? "")) {
    const stem = word.endsWith("する") ? word.slice(0, -2) : word;
    return { dictionary: word, politeNonPast: `${stem}します`, politeNegative: `${stem}しません`, politePast: `${stem}しました`, politePastNegative: `${stem}しませんでした`, te: `${stem}して`, nai: `${stem}しない`, ta: `${stem}した`, tai: `${stem}したい` };
  }
  if (/ichidan/u.test(item.partOfSpeech ?? "")) {
    const stem = word.slice(0, -1);
    return { dictionary: word, politeNonPast: `${stem}ます`, politeNegative: `${stem}ません`, politePast: `${stem}ました`, politePastNegative: `${stem}ませんでした`, te: `${stem}て`, nai: `${stem}ない`, ta: `${stem}た`, tai: `${stem}たい` };
  }
  const ending = word.slice(-1);
  const stem = word.slice(0, -1);
  const i = iRow[ending];
  if (!i) return {};
  const teEnding = ["う", "つ", "る"].includes(ending) ? "って" : ["む", "ぶ", "ぬ"].includes(ending) ? "んで" : ending === "く" ? (word === "行く" ? "って" : "いて") : ending === "ぐ" ? "いで" : "して";
  const taEnding = teEnding.replace(/て$/u, "た").replace(/で$/u, "だ");
  return {
    dictionary: word,
    politeNonPast: `${stem}${i}ます`,
    politeNegative: `${stem}${i}ません`,
    politePast: `${stem}${i}ました`,
    politePastNegative: `${stem}${i}ませんでした`,
    te: `${stem}${teEnding}`,
    nai: `${stem}${aRow[ending]}ない`,
    ta: `${stem}${taEnding}`,
    tai: `${stem}${i}たい`,
  };
}
