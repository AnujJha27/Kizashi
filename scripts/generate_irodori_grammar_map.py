#!/usr/bin/env python3
"""Map only clear Irodori sentence-pattern overlaps to canonical grammar IDs."""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path
from typing import Any


SOURCE_URL = "https://www.irodori.jpf.go.jp/en/resources.html"
PATTERN_URL = "https://www.irodori.jpf.go.jp/assets/data/sentence_patterns_list.xlsx"
LICENSE = "Japan Foundation Irodori terms; personal educational use"


def read_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"Expected an object in {path}.")
    return value


def text(value: Any) -> str:
    return value.strip() if isinstance(value, str) else ""


def normalize(value: Any) -> str:
    value = unicodedata.normalize("NFKC", text(value)).casefold()
    value = re.sub(r"[\s【】「」『』()（）\[\]{}-]", "", value)
    return re.sub(r"(?:バショ|ワタシ|キ|ダイカ|ダイ|カナ|ス|ヒト|ナニ|ジカン|カタチ|マス形|辞書形|ジショ|ケイ|イ|オ|ネガ|スウ|ノモノ|バsy|ニチジ|フツウケイ|ギモンヒョウゲン|頻度|程度|原因理由|手段)", "", value)


# Deliberately exact/anchored rules: false grammar links are worse than a lower count.
RULES: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("grammar-desu", ("nですn1はn2です", "nでした")),
    ("grammar-wa", ("nは?", "nは好きじゃないです")),
    ("grammar-ka", ("sか?", "疑問表現ですか?")),
    ("grammar-mo", ("nも", "数量も")),
    ("grammar-no", ("n1のn2",)),
    ("grammar-ga", ("nが好きです", "nがほしいんですが", "nができます")),
    ("grammar-suki", ("nが好きです", "vるのが好きです", "いaいのが好きです")),
    ("grammar-hoshii", ("nがほしいんですが",)),
    ("grammar-ni", ("場所に住んでいます", "時間にごろvます", "nに行きます", "場所にnがあります", "場所にnはありますか?", "場所にいます")),
    ("grammar-masu", ("vますか?マス形", "nをvます", "時間にごろvます")),
    ("grammar-masen", ("nはvません", "あまりvません頻度", "あまりぜんぜんvません頻度")),
    ("grammar-mashita", ("vましたvませんでした", "もうvました")),
    ("grammar-arimasu", ("場所にnがあります", "場所にnが数あります", "nはありますか?", "場所にnはありますか?")),
    ("grammar-wo", ("nをvます",)),
    ("grammar-de", ("場所でvます", "人と場所でvます", "nで手段")),
    ("grammar-to", ("人と場所でvます",)),
    ("grammar-dictionary-form", ("vる?辞書形", "vることができます")),
    ("grammar-te-form", ("vてくださいvて", "v1てv2", "v1て、v2")),
    ("grammar-tai", ("vたいです", "nに行きたいんですが...")),
    ("grammar-temoii", ("n借りてもいいですか?", "vてもいいですか?", "vてもいいでしょうか?")),
    ("grammar-mashou", ("vましょう", "vましょうか?")),
    ("grammar-masenka", ("vませんか?", "vに行きませんか?")),
    ("grammar-kara", ("s1からs2", "nで、原因理由", "vて、原因理由")),
    ("grammar-kara-made", ("時間から時間まで", "場所から場所まで")),
    ("grammar-ya", ("n1やn2",)),
    ("grammar-te-kudasai", ("vてくださいvて",)),
    ("grammar-na-adjective", ("ナaです", "ナaですね", "ナaなnですね")),
    ("grammar-i-adjective", ("ナaですイaいです", "ナaですねイaいですね")),
    ("grammar-i-adjective-negative", ("イaくないです", "ナaじゃないですイaくないです")),
    ("grammar-i-adjective-past", ("イaかったです",)),
    ("grammar-teiru", ("vています1", "vています2", "vています3")),
    ("grammar-tewaikenai", ("vてはいけませんだめです",)),
    ("grammar-naidekudasai", ("vないでください",)),
    ("grammar-nai-form", ("nはvないです", "vないでください")),
    ("grammar-ta-form", ("vましたvませんでした", "vたことがあります")),
    ("grammar-mae-ni", ("vる前に", "nの前に")),
    ("grammar-ato-de", ("vたあと", "nのあとで")),
    ("grammar-toki", ("nのとき", "vるとき", "ときに")),
    ("grammar-nagara", ("vながら",)),
)


def canonical_ids(pattern: str) -> list[str]:
    normalized = normalize(pattern)
    return [grammar_id for grammar_id, candidates in RULES if normalized in {normalize(candidate) for candidate in candidates}]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=Path("data/staging/irodori-grammar.json"))
    parser.add_argument("--output", type=Path, default=Path("data/source-maps/irodori-grammar.json"))
    args = parser.parse_args()
    package = read_json(args.input)
    records = package.get("records", {}).get("grammar", [])
    mapped: dict[str, list[dict[str, Any]]] = {}
    for record in records if isinstance(records, list) else []:
        if not isinstance(record, dict):
            continue
        for grammar_id in canonical_ids(text(record.get("pattern"))):
            mapped.setdefault(grammar_id, []).append({
                "sourceId": "irodori-sentence-patterns",
                "sourceRecordId": text(record.get("id")),
                "sourceCourse": text(record.get("sourceCourse")),
                "sourceLevel": text(record.get("sourceLevel")),
                "pattern": text(record.get("pattern")),
                "sectionTitle": f"Sentence pattern · {text(record.get('sourceCourse')) or 'Irodori'}",
                "url": SOURCE_URL,
                "sourceUrl": PATTERN_URL,
                "relationship": "communicative-pattern",
                "description": f"Irodori situational pattern: {text(record.get('pattern')).replace(chr(10), ' / ')}.",
                "license": LICENSE,
                "attribution": "Japan Foundation Irodori",
            })
    for values in mapped.values():
        values.sort(key=lambda item: (item["sourceLevel"], item["sourceRecordId"]))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(mapped, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), "mappedRecords": sum(map(len, mapped.values())), "canonicalConcepts": len(mapped)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
