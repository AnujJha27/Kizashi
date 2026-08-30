#!/usr/bin/env python3
"""Extract structured, review-only book facts with chapter/page provenance."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

from extract_book_candidates import checksum, extracted_text, now


CATEGORY_ORDER = ("vocabulary", "kanji", "grammar", "reading", "listening")
CATEGORIES = set(CATEGORY_ORDER)
ALIASES = {
    "vocab": "vocabulary",
    "word": "vocabulary",
    "words": "vocabulary",
    "character": "kanji",
    "characters": "kanji",
    "grammar-point": "grammar",
    "grammar_point": "grammar",
    "passage": "reading",
    "audio": "listening",
}


def parts(raw: str) -> list[str]:
    return [part.strip() for part in raw.split("\t")]


def base_record(record_id: str, category: str, title: str, book_id: str, chapter: str, page: int | None, raw: str, source_id: str) -> dict[str, Any]:
    return {
        "id": record_id,
        "slug": record_id,
        "title": title,
        "jlptLevel": None,
        "category": category,
        "reviewStatus": "pending",
        "subcategory": "book extraction",
        "difficulty": 2,
        "prerequisiteIds": [],
        "tags": ["book-extraction", "source-review"],
        "sourceIds": [source_id],
        "sourceRecord": {"bookId": book_id, "chapter": chapter, "page": page, "extractedFactType": category, "rawText": raw},
    }


def record_from_line(line: str, book_id: str, chapter: str, page: int | None, source_id: str) -> dict[str, Any] | None:
    fields = parts(line)
    if len(fields) < 2:
        return None
    category = fields[0].lower()
    category = ALIASES.get(category, category)
    if category not in CATEGORIES:
        return None
    raw = "\t".join(fields[1:]).strip()
    digest = hashlib.sha1(f"{book_id}|{chapter}|{page}|{category}|{raw}".encode("utf-8")).hexdigest()[:12]
    record_id = f"book-{book_id}-{digest}"
    values = fields[1:]
    title = values[0]
    record = base_record(record_id, category, title, book_id, chapter, page, raw, source_id)
    if category == "vocabulary":
        record.update({"writtenForm": values[0], "reading": values[1] if len(values) > 1 else "", "meanings": values[2:] or [], "partOfSpeech": "", "exampleSentences": [], "collocations": [], "relatedWords": [], "antonyms": []})
    elif category == "kanji":
        record.update({"character": values[0], "meanings": values[1:] or [], "onyomi": [], "kunyomi": [], "usefulWords": []})
    elif category == "grammar":
        record.update({"pattern": values[0], "meaning": values[1] if len(values) > 1 else "", "formation": values[2] if len(values) > 2 else values[0], "intuition": "", "usageConditions": [], "examples": [], "commonMistakes": [], "contrastIds": [], "practiceQuestionIds": []})
    elif category == "reading":
        record.update({"passage": "\t".join(values), "translation": "", "vocabularyIds": [], "grammarIds": [], "kanjiIds": [], "estimatedDifficulty": 2, "questions": []})
    else:
        record.update({"situation": values[0], "audioUrl": None, "voice": "ja-JP", "speed": 0.9, "sourceType": "imported", "transcript": "\t".join(values), "questions": []})
    return record


def build(path: Path, book_id: str) -> dict[str, Any]:
    retrieved_at = now()
    source_id = f"book-{book_id}"
    records: dict[str, list[dict[str, Any]]] = {category: [] for category in CATEGORY_ORDER}
    chapter = ""
    page: int | None = None
    for page_text in extracted_text(path).split("\f"):
        for line in page_text.splitlines():
            marker = parts(line)
            if not marker:
                continue
            if marker[0].upper() == "CHAPTER" and len(marker) > 1:
                chapter = marker[1]
                continue
            if marker[0].upper() == "PAGE" and len(marker) > 1:
                try:
                    page = int(marker[1])
                except ValueError:
                    page = None
                continue
            record = record_from_line(line, book_id, chapter, page, source_id)
            if record:
                records[record["category"]].append(record)
    source = {"id": source_id, "name": f"Book extraction · {book_id}", "type": "curriculum", "retrievedAt": retrieved_at, "sha256": checksum(path), "localFilename": path.name, "notes": "Structured facts only; verify page, license, canonical facts, and lesson fit before approval."}
    return {"schemaVersion": 1, "status": "staged", "generatedAt": retrieved_at, "sourcePolicy": "Book extraction is review-only. Do not publish copied prose or exercises; verify every fact before approval.", "sourceManifest": [source], "sources": [source], "records": records, "stats": {category: len(records[category]) for category in CATEGORY_ORDER}}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--book-id", required=True)
    parser.add_argument("--output", type=Path, default=Path("data/staging/book-content.json"))
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    package = build(args.input, args.book_id)
    if args.dry_run:
        print(json.dumps(package["stats"], ensure_ascii=False))
        return 0
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), **package["stats"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
