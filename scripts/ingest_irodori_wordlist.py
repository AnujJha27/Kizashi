#!/usr/bin/env python3
"""Convert the official Irodori Excel word list into review-only JSON records."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


NS = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
SOURCE_URL = "https://www.irodori.jpf.go.jp/assets/data/wordlist_all.xlsx"
SOURCE_ID = "irodori-wordlist"


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def text(value: Any) -> str:
    return value.strip() if isinstance(value, str) else ""


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def column_number(reference: str) -> int:
    letters = re.match(r"[A-Z]+", reference.upper())
    if not letters:
        return 0
    result = 0
    for character in letters.group(0):
        result = result * 26 + ord(character) - ord("A") + 1
    return result - 1


def shared_strings(archive: zipfile.ZipFile) -> list[str]:
    try:
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    return ["".join(node.itertext()).strip() for node in root.findall("main:si", NS)]


def cell_value(cell: ET.Element, shared: list[str]) -> str:
    if cell.get("t") == "inlineStr":
        return "".join(cell.find("main:is", NS).itertext()).strip() if cell.find("main:is", NS) is not None else ""
    value = text(cell.findtext("main:v", default="", namespaces=NS))
    if cell.get("t") == "s" and value.isdigit() and int(value) < len(shared):
        return shared[int(value)]
    return value


def workbook_rows(path: Path) -> list[tuple[str, int, list[str]]]:
    rows: list[tuple[str, int, list[str]]] = []
    with zipfile.ZipFile(path) as archive:
        shared = shared_strings(archive)
        sheets = sorted(name for name in archive.namelist() if name.startswith("xl/worksheets/sheet") and name.endswith(".xml"))
        for sheet in sheets:
            root = ET.fromstring(archive.read(sheet))
            sheet_name = Path(sheet).stem
            for row in root.findall(".//main:sheetData/main:row", NS):
                max_column = max((column_number(cell.get("r", "")) for cell in row.findall("main:c", NS)), default=-1)
                values = [""] * (max_column + 1)
                for cell in row.findall("main:c", NS):
                    index = column_number(cell.get("r", ""))
                    if index >= len(values):
                        values.extend([""] * (index + 1 - len(values)))
                    values[index] = cell_value(cell, shared)
                rows.append((sheet_name, int(row.get("r", "0")), values))
    return rows


def header_score(row: list[str]) -> int:
    haystack = " ".join(row).lower()
    return sum(token in haystack for token in ("ことば", "言葉", "word", "japanese", "漢字", "kanji", "英語", "english", "意味", "meaning", "lesson", "課"))


def headers(row: list[str]) -> dict[str, int]:
    result: dict[str, int] = {}
    for index, value in enumerate(row):
        normalized = value.lower().replace(" ", "")
        if any(token in normalized for token in ("ことば", "言葉", "見出し", "word", "japanese")):
            result.setdefault("word", index)
        if any(token in normalized for token in ("漢字", "kanji")):
            result.setdefault("kanji", index)
        if any(token in normalized for token in ("かな", "読み", "reading", "yomi")):
            result.setdefault("reading", index)
        if any(token in normalized for token in ("英語", "英訳", "english", "意味", "meaning", "translation")):
            result.setdefault("meaning", index)
        if any(token in normalized for token in ("課", "lesson")):
            result.setdefault("lesson", index)
        if any(token in normalized for token in ("レベル", "level", "course")):
            result.setdefault("course", index)
    return result


def pick(row: list[str], mapping: dict[str, int], key: str) -> str:
    index = mapping.get(key, -1)
    return row[index].strip() if 0 <= index < len(row) else ""


def split_forms(value: str) -> tuple[str, str]:
    value = value.strip()
    if "/" not in value:
        return value, ""
    first, second = (part.strip() for part in value.split("/", 1))
    return second or first, first if second else ""


def stable_id(written: str, reading: str, sheet: str, row_number: int) -> str:
    digest = hashlib.sha1("|".join((written, reading, sheet, str(row_number))).encode("utf-8")).hexdigest()[:12]
    return f"irodori-vocabulary-{digest}"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=Path("data/source-cache/irodori-wordlist_all.xlsx"))
    parser.add_argument("--output", type=Path, default=Path("data/staging/irodori-vocabulary.json"))
    args = parser.parse_args()

    retrieved_at = now()
    rows = workbook_rows(args.input)
    by_sheet: dict[str, list[tuple[int, list[str]]]] = {}
    for sheet, row_number, values in rows:
        by_sheet.setdefault(sheet, []).append((row_number, values))

    vocabulary: list[dict[str, Any]] = []
    for sheet, sheet_rows in by_sheet.items():
        header = max(sheet_rows, key=lambda entry: header_score(entry[1]), default=(0, []))
        mapping = headers(header[1])
        if "word" not in mapping or "meaning" not in mapping:
            continue
        for row_number, row in sheet_rows:
            if row_number <= header[0]:
                continue
            raw_word = pick(row, mapping, "word")
            meaning = pick(row, mapping, "meaning")
            if not raw_word or not meaning or raw_word.lower() == "word":
                continue
            written, reading = split_forms(raw_word)
            reading = pick(row, mapping, "reading") or reading
            if not reading and not all("\u3040" <= character <= "\u30ff" for character in written):
                continue
            reading = reading or written
            item_id = stable_id(written, reading, sheet, row_number)
            vocabulary.append({
                "id": item_id,
                "slug": item_id,
                "title": written,
                "jlptLevel": None,
                "category": "vocabulary",
                "reviewStatus": "pending",
                "subcategory": "irodori",
                "difficulty": 2,
                "prerequisiteIds": [],
                "tags": ["irodori", "source-review"],
                "sourceIds": [SOURCE_ID],
                "writtenForm": written,
                "reading": reading,
                "meanings": [meaning],
                "partOfSpeech": "source record",
                "exampleSentences": [],
                "collocations": [],
                "relatedWords": [],
                "antonyms": [],
                "notes": "Irodori vocabulary reference; review wording, reading, and lesson placement before publishing.",
                "sourceRecord": {"sheet": sheet, "row": row_number, "cells": row, "lesson": pick(row, mapping, "lesson"), "course": pick(row, mapping, "course")},
            })

    package = {
        "schemaVersion": 1,
        "status": "staged",
        "generatedAt": retrieved_at,
        "sources": [{"id": SOURCE_ID, "name": "Japan Foundation Irodori vocabulary", "type": "curriculum", "url": SOURCE_URL, "retrievedAt": retrieved_at, "sha256": sha256(args.input), "localFilename": args.input.name, "notes": "Official vocabulary reference; review terms before publishing derived content."}],
        "records": {"vocabulary": vocabulary, "kanji": [], "grammar": [], "tatoebaExamples": []},
        "stats": {"vocabulary": len(vocabulary), "kanji": 0, "grammar": 0, "tatoebaExamples": 0},
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), "stats": package["stats"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
