#!/usr/bin/env python3
"""Convert the official Irodori kanji progression list into review-only records."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from ingest_irodori_wordlist import now, pick, sha256, text, workbook_rows

SOURCE_ID = "irodori-kanji"
SOURCE_URL = "https://www.irodori.jpf.go.jp/assets/data/kanji_list.xlsx"


def headers(row: list[str]) -> dict[str, int]:
    result: dict[str, int] = {}
    for index, value in enumerate(row):
        normalized = value.lower().replace(" ", "")
        if any(token in normalized for token in ("漢字", "kanji", "character")) and "番号" not in normalized:
            result.setdefault("character", index)
        if any(token in normalized for token in ("意味", "meaning", "english", "translation")):
            result.setdefault("meaning", index)
        if any(token in normalized for token in ("読み", "かな", "reading", "yomi")):
            result.setdefault("reading", index)
        if any(token in normalized for token in ("ことば", "言葉", "単語", "word", "vocabulary", "example")):
            result.setdefault("word", index)
        if any(token in normalized for token in ("課", "lesson")):
            result.setdefault("lesson", index)
        if any(token in normalized for token in ("レベル", "level", "course", "book")):
            result.setdefault("course", index)
    return result


def header_score(row: list[str]) -> int:
    haystack = " ".join(row).lower()
    return sum(token in haystack for token in ("漢字", "kanji", "character", "読み", "reading", "意味", "meaning", "lesson", "課"))


def stable_id(character: str, sheet: str, row_number: int) -> str:
    import hashlib

    digest = hashlib.sha1(f"{character}|{sheet}|{row_number}".encode("utf-8")).hexdigest()[:12]
    return f"irodori-kanji-{digest}"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=Path("data/source-cache/irodori-kanji_list.xlsx"))
    parser.add_argument("--output", type=Path, default=Path("data/staging/irodori-kanji.json"))
    args = parser.parse_args()

    retrieved_at = now()
    by_sheet: dict[str, list[tuple[int, list[str]]]] = {}
    for sheet, row_number, values in workbook_rows(args.input):
        by_sheet.setdefault(sheet, []).append((row_number, values))

    kanji: list[dict[str, Any]] = []
    for sheet, sheet_rows in by_sheet.items():
        header = max(sheet_rows, key=lambda entry: header_score(entry[1]), default=(0, []))
        mapping = headers(header[1])
        if "character" not in mapping:
            continue
        for row_number, row in sheet_rows:
            if row_number <= header[0]:
                continue
            character = pick(row, mapping, "character")
            if not character or not re.fullmatch(r"[一-龯々〆ヵヶ]", character):
                continue
            item_id = stable_id(character, sheet, row_number)
            kanji.append({
                "id": item_id,
                "slug": item_id,
                "title": character,
                "jlptLevel": None,
                "category": "kanji",
                "reviewStatus": "pending",
                "subcategory": "irodori",
                "difficulty": 2,
                "prerequisiteIds": [],
                "tags": ["irodori", "source-review"],
                "sourceIds": [SOURCE_ID],
                "character": character,
                "meanings": [pick(row, mapping, "meaning")] if pick(row, mapping, "meaning") else [],
                "onyomi": [],
                "kunyomi": [],
                "usefulWords": [],
                "notes": "Irodori kanji progression reference; confirm dictionary readings, meanings, useful words, and lesson placement before publishing.",
                "sourceRecord": {"sheet": sheet, "row": row_number, "cells": row, "reading": pick(row, mapping, "reading"), "word": pick(row, mapping, "word"), "lesson": pick(row, mapping, "lesson"), "course": pick(row, mapping, "course")},
            })

    package = {
        "schemaVersion": 1,
        "status": "staged",
        "generatedAt": retrieved_at,
        "sources": [{"id": SOURCE_ID, "name": "Japan Foundation Irodori kanji", "type": "curriculum", "license": "Japan Foundation Irodori terms; personal educational use", "url": SOURCE_URL, "retrievedAt": retrieved_at, "sha256": sha256(args.input), "localFilename": args.input.name, "notes": "Official kanji progression reference; dictionary facts require review before publishing."}],
        "records": {"vocabulary": [], "kanji": kanji, "grammar": [], "tatoebaExamples": []},
        "stats": {"vocabulary": 0, "kanji": len(kanji), "grammar": 0, "tatoebaExamples": 0},
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), "stats": package["stats"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
