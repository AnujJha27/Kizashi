#!/usr/bin/env python3
"""Convert the official Irodori sentence-pattern Excel list into review-only grammar records."""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
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


def clean_source_label(value: str) -> str:
    value = unicodedata.normalize("NFKC", value.strip())
    value = re.sub(r"\s+", " ", value)
    return re.sub(r"(?:ニュウモン|ショキュウ)$", "", value)


def source_course(row: list[str], previous: str) -> str:
    # The workbook repeats the course only at the start of each course block.
    raw = text(row[0]) if row else ""
    if raw in {"初級1ショキュウ", "初級2ショキュウ", "入門ニュウモン", "初中級"}:
        return clean_source_label(raw)
    return previous


def source_lesson(row: list[str], previous: str) -> tuple[str, str]:
    # Column H contains the reliable course/lesson pair even though its header is blank.
    raw = text(row[7]) if len(row) > 7 else ""
    lines = [line.strip() for line in raw.splitlines() if line.strip()]
    course_lesson = lines[1] if len(lines) > 1 else ""
    if course_lesson:
        return course_lesson, lines[0] if lines else previous
    return previous, ""


def source_level(course: str) -> str:
    return {
        "入門": "Starter",
        "初級1": "Elementary 1",
        "初級2": "Elementary 2",
        "初中級": "Pre-Intermediate",
        "中級1": "Intermediate 1",
        "中級2": "Intermediate 2",
    }.get(course, "")


def source_examples(value: str) -> list[dict[str, str]]:
    examples: list[dict[str, str]] = []
    for line in value.splitlines():
        japanese = line.strip()
        if not japanese:
            continue
        # Irodori's spreadsheet appends kana reading notes to some examples;
        # keep the untouched cell in sourceRecord and remove only that suffix
        # from the learner-facing candidate.
        japanese = re.sub(r"(?<=[。！？])\s*[ぁ-ゖァ-ヴー]+$", "", japanese).strip()
        if japanese:
            examples.append({
                "japanese": japanese,
                "translation": "",
                "note": "Irodori source example; translation pending review.",
                "sourceId": SOURCE_ID,
                "license": "Japan Foundation Irodori terms; personal educational use",
            })
    return examples


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
        current_course = ""
        current_lesson = ""
        current_lesson_title = ""
        for row_number, row in sheet_rows:
            if row_number <= header[0]:
                continue
            current_course = source_course(row, current_course)
            lesson, course_from_row = source_lesson(row, current_lesson)
            if lesson:
                current_lesson = lesson
            if course_from_row:
                current_course = clean_source_label(course_from_row)
            raw_title = text(row[2]) if len(row) > 2 else ""
            if raw_title:
                title_lines = [line.strip() for line in raw_title.splitlines() if line.strip()]
                current_lesson_title = title_lines[-1] if title_lines else current_lesson_title
            pattern = pick(row, mapping, "pattern")
            meaning = pick(row, mapping, "meaning")
            if not pattern or pattern.lower() in {"pattern", "sentence pattern"}:
                continue
            raw_example = pick(row, mapping, "example")
            examples = source_examples(raw_example)
            course = current_course or clean_source_label(course_from_row)
            level = source_level(course)
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
                "fieldSourceIds": {
                    "pattern": [SOURCE_ID],
                    "meaning": [SOURCE_ID],
                    "formation": [SOURCE_ID],
                    "examples": [SOURCE_ID],
                    "sourceCourse": [SOURCE_ID],
                    "sourceLevel": [SOURCE_ID],
                },
                "sourceCourse": course,
                "sourceLevel": level,
                "pattern": pattern,
                "meaning": meaning,
                "formation": pick(row, mapping, "formation"),
                "intuition": meaning,
                "usageConditions": [],
                "examples": examples,
                "commonMistakes": [],
                "contrastIds": [],
                "practiceQuestionIds": [],
                "notes": "Irodori sentence-pattern reference; review the pattern, examples, prerequisites, and JLPT fit before publishing.",
                "sourceRecord": {
                    "sheet": sheet,
                    "row": row_number,
                    "cells": row,
                    "lesson": current_lesson,
                    "lessonTitle": current_lesson_title,
                    "course": course,
                    "sourceLevel": level,
                    "example": raw_example,
                },
            })

    package = {
        "schemaVersion": 1,
        "status": "staged",
        "generatedAt": retrieved_at,
        "sources": [{"id": SOURCE_ID, "name": "Japan Foundation Irodori sentence patterns", "type": "curriculum", "license": "Japan Foundation Irodori terms; personal educational use", "url": SOURCE_URL, "retrievedAt": retrieved_at, "sha256": sha256(args.input), "localFilename": args.input.name, "notes": "Official sentence-pattern reference; review terms before publishing derived content."}],
        "records": {"vocabulary": [], "kanji": [], "grammar": grammar, "tatoebaExamples": []},
        "stats": {"vocabulary": 0, "kanji": 0, "grammar": len(grammar), "tatoebaExamples": 0},
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), "stats": package["stats"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
