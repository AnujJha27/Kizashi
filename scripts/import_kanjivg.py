#!/usr/bin/env python3
"""Build the local N5/N4 KanjiVG stroke dataset used by Kizashi's trainer."""

import argparse
import json
import re
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

KANJIVG_VERSION = "r20260714"
KANJIVG_SOURCE_URL = "https://github.com/KanjiVG/kanjivg"
KANJIVG_URL = f"https://raw.githubusercontent.com/KanjiVG/kanjivg/{KANJIVG_VERSION}/kanji/{{code}}.svg"
SOURCE_FILES = (
    "n5-foundations.json",
    "n5-conversation-expansion.json",
    "n5-practical-expansion.json",
    "n5-life-expansion.json",
    "n4-grammar-expansion.json",
)
STAGING_FILE = "kizashi-n5-source-review.json"


def canonical_characters(data_dir: Path) -> list[str]:
    characters: set[str] = set()
    for filename in SOURCE_FILES:
        payload = json.loads((data_dir / filename).read_text(encoding="utf-8"))
        characters.update(item["character"] for item in payload.get("kanji", []))
    staging_path = data_dir / "staging" / STAGING_FILE
    if staging_path.exists():
        payload = json.loads(staging_path.read_text(encoding="utf-8"))
        for item in payload.get("kanji", []):
            classification = item.get("classification") if isinstance(item, dict) else {}
            level = classification.get("level") if isinstance(classification, dict) else None
            if level in {"N5", "N4"} or item.get("jlptLevel") in {"N5", "N4"}:
                character = item.get("character")
                if isinstance(character, str) and len(character) == 1:
                    characters.add(character)
    return sorted(characters)


def parse_svg(character: str, svg: str) -> dict:
    root = ET.fromstring(svg)
    strokes = []
    for path in root.iter():
        path_id = path.attrib.get("id", "")
        match = re.search(r"-s(\d+)$", path_id)
        if not match:
            continue
        path_data = path.attrib.get("d", "").strip()
        if path_data:
            strokes.append({"order": int(match.group(1)), "path": path_data})
    strokes.sort(key=lambda stroke: stroke["order"])
    expected = list(range(1, len(strokes) + 1))
    if not strokes or [stroke["order"] for stroke in strokes] != expected:
        raise ValueError(f"{character}: missing or unordered KanjiVG strokes")
    return {"character": character, "strokes": strokes}


def load_svg(character: str, source_dir: Path | None) -> str:
    code = f"{ord(character):05x}"
    if source_dir:
        return (source_dir / f"{code}.svg").read_text(encoding="utf-8")
    with urllib.request.urlopen(KANJIVG_URL.format(code=code), timeout=30) as response:
        return response.read().decode("utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=Path, default=Path("data"))
    parser.add_argument("--source-dir", type=Path, help="Read downloaded KanjiVG SVGs from this directory.")
    parser.add_argument("--output", type=Path, default=Path("data/kanjivg-strokes.json"))
    args = parser.parse_args()

    characters = canonical_characters(args.data_dir)
    records = {}
    missing = []
    for character in characters:
        try:
            records[character] = parse_svg(character, load_svg(character, args.source_dir))
        except (FileNotFoundError, urllib.error.URLError) as error:
            missing.append({"character": character, "error": str(error)})
    if missing:
        raise SystemExit("Missing KanjiVG source for: " + ", ".join(entry["character"] for entry in missing))

    payload = {
        "source": "KanjiVG",
        "sourceUrl": KANJIVG_SOURCE_URL,
        "license": "CC BY-SA 3.0",
        "attribution": "KanjiVG contributors",
        "version": KANJIVG_VERSION,
        "characters": records,
    }
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Imported {len(records)} canonical kanji into {args.output}")


if __name__ == "__main__":
    main()
