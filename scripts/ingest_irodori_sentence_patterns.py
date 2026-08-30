#!/usr/bin/env python3
"""Convert the official Irodori sentence-pattern Excel list into review-only grammar records."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from ingest_irodori_wordlist import now, pick, sha256, text, workbook_rows

SOURCE_ID = "irodori-sentence-patterns"
SOURCE_URL = "https://www.irodori.jpf.go.jp/assets/data/sentence_patterns_list.xlsx"


def strings(value: Any) -> list[str]:
    return [entry.strip() for entry in value if isinstance(entry, str) and entry.strip()] if isinstance(value, list) else []


def pattern_headers(row: list[str]) -> dict[str, int]:
    result: dict[str, int] = {}
    for index, value in enumerate(row):
        normalized = value.lower().replace(" ", "")
        if any(token in normalized for token in ("文型", "文法", "sentencepattern", "pattern", "expression", "ぶんけい")):
            result.setdefault("pattern", index)
        if any(token in normalized for token in ("意味", "meaning", "english", "translation")):
            result.setdefault("meaning", index)
        if any(token in normalized for token in ("接続", "connection", "formation", "form")):
            result.setdefault("formation", index)
        if any(token in normalized for token in ("例文", "example", "sentence")):
            result.setdefault("example", index)
        if any(token in normalized for token in ("課", "lesson")):
            result.setdefault("lesson", index)
        if any(token in normalized for token in ("レベル", "level", "course", "book")):
            result.setdefault("course", index)
    return result


def header_score(row: list[str]) -> int:
    haystack = " ".join(row).lower()
    return sum(token in haystack for token in ("文型", "文法", "pattern", "意味", "meaning", "接続", "formation", "例文", "example", "lesson", "課"))


def stable_id(pattern: str, sheet: str, row_number: int) -> str:
    import hashlib

    digest = hashlib.sha1(f"{pattern}|{sheet}|{row_number}".encode("utf-8")).hexdigest()[:12]
    return f"irodori-grammar-{digest}"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=Path("data/source-cache/irodori-sentence-patterns.xlsx"))
    parser.add_argument("--output", type=Path, default=Path("data/staging/irodori-grammar.json"))
    args = parser.parse_args()

    retrieved_at = now()
    by_sheet: dict[str, list[tuple[int, list[str]]]] = {}
    for sheet, row_number, values in workbook_rows(args.input):
        by_sheet.setdefault(sheet, []).append((row_number, values))

    grammar: list[dict[str, Any]] = []
    for sheet, sheet_rows in by_sheet.items():
        header = max(sheet_rows, key=lambda entry: header_score(entry[1]), default=(0, []))
        mapping = pattern_headers(header[1])
        if "pattern" not in mapping:
            continue
        for row_number, row in sheet_rows:
            if row_number <= header[0]:
                continue
            pattern = pick(row, mapping, "pattern")
            meaning = pick(row, mapping, "meaning")
            if not pattern or pattern.lower() in {"pattern", "sentence pattern"}:
                continue
            item_id = stable_id(pattern, sheet, row_number)
            grammar.append({
                "id": item_id,
                "slug": item_id,
                "title": pattern,
                "jlptLevel": None,
                "category": "grammar",
                "reviewStatus": "pending",
                "subcategory": "irodori",
                "difficulty": 2,
                "prerequisiteIds": [],
                "tags": ["irodori", "source-review"],
                "sourceIds": [SOURCE_ID],
                "pattern": pattern,
                "meaning": meaning,
                "formation": pick(row, mapping, "formation"),
                "intuition": meaning,
                "usageConditions": [],
                "examples": [],
                "commonMistakes": [],
                "contrastIds": [],
                "practiceQuestionIds": [],
                "notes": "Irodori sentence-pattern reference; review the pattern, examples, prerequisites, and JLPT fit before publishing.",
                "sourceRecord": {"sheet": sheet, "row": row_number, "cells": row, "lesson": pick(row, mapping, "lesson"), "course": pick(row, mapping, "course"), "example": pick(row, mapping, "example")},
            })

    package = {
        "schemaVersion": 1,
        "status": "staged",
        "generatedAt": retrieved_at,
        "sources": [{"id": SOURCE_ID, "name": "Japan Foundation Irodori sentence patterns", "type": "curriculum", "url": SOURCE_URL, "retrievedAt": retrieved_at, "sha256": sha256(args.input), "localFilename": args.input.name, "notes": "Official sentence-pattern reference; review terms before publishing derived content."}],
        "records": {"vocabulary": [], "kanji": [], "grammar": grammar, "tatoebaExamples": []},
        "stats": {"vocabulary": 0, "kanji": 0, "grammar": len(grammar), "tatoebaExamples": 0},
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), "stats": package["stats"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
