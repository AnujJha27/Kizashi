#!/usr/bin/env python3
"""Extract conservative, review-only book candidates with page provenance."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


JAPANESE = re.compile(r"[ぁ-んァ-ヶ一-龯々ー・]+")
KANA = re.compile(r"^[ぁ-んァ-ヶー・]+$")


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def checksum(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def extracted_text(path: Path) -> str:
    if path.suffix.lower() in {".txt", ".tsv", ".csv"}:
        return path.read_text(encoding="utf-8", errors="replace")
    executable = shutil.which("pdftotext")
    if not executable:
        raise RuntimeError("Book extraction requires pdftotext on PATH or a text export.")
    result = subprocess.run([executable, "-layout", str(path), "-"], check=True, capture_output=True, text=True, encoding="utf-8", errors="replace")
    return result.stdout


def candidate(line: str, page: int, book_id: str, source_id: str) -> dict[str, Any] | None:
    raw = " ".join(line.split())
    if not re.search(r"[A-Za-z]", raw):
        return None
    runs = list(JAPANESE.finditer(raw))
    if not runs:
        return None
    written = runs[0].group(0).strip("・")
    if not written or len(written) > 32 or written.isdigit():
        return None
    reading = next((match.group(0) for match in runs[1:] if KANA.fullmatch(match.group(0))), "")
    item_id = f"{source_id}-{hashlib.sha1(f'{book_id}|{page}|{raw}'.encode()).hexdigest()[:12]}"
    return {
        "id": item_id,
        "slug": item_id,
        "title": written,
        "jlptLevel": None,
        "category": "vocabulary",
        "reviewStatus": "pending",
        "subcategory": "book extraction",
        "difficulty": 2,
        "prerequisiteIds": [],
        "tags": ["book-extraction", "source-review"],
        "sourceIds": [source_id],
        "writtenForm": written,
        "reading": reading,
        "meanings": [],
        "partOfSpeech": "",
        "exampleSentences": [],
        "collocations": [],
        "relatedWords": [],
        "antonyms": [],
        "sourceRecord": {"bookId": book_id, "page": page, "rawText": raw},
    }


def build(path: Path, book_id: str) -> dict[str, Any]:
    source_id = f"book-{book_id}"
    retrieved_at = now()
    source = {"id": source_id, "name": f"Book extraction · {book_id}", "type": "curriculum", "retrievedAt": retrieved_at, "sha256": checksum(path), "localFilename": path.name, "notes": "Local book candidate; do not publish copied prose or exercises."}
    records: list[dict[str, Any]] = []
    seen: set[tuple[int, str]] = set()
    text = extracted_text(path)
    if not text.strip():
        raise RuntimeError("No extractable text found; provide OCR or a text export for this book.")
    for page, page_text in enumerate(text.split("\f"), 1):
        for line in page_text.splitlines():
            item = candidate(line, page, book_id, source_id)
            if not item or (page, item["writtenForm"]) in seen:
                continue
            seen.add((page, item["writtenForm"]))
            records.append(item)
    return {
        "schemaVersion": 1,
        "status": "staged",
        "generatedAt": retrieved_at,
        "sourcePolicy": "Book extraction is review-only. Verify page, license, canonical facts, and lesson fit before approval.",
        "sourceManifest": [source],
        "sources": [source],
        "records": {"vocabulary": records, "kanji": [], "grammar": [], "readings": [], "listening": []},
        "stats": {"vocabulary": len(records), "kanji": 0, "grammar": 0, "readings": 0, "listening": 0},
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--book-id", required=True)
    parser.add_argument("--output", type=Path, default=Path("data/staging/book-candidates.json"))
    parser.add_argument("--dry-run", action="store_true", help="Print stats without writing the candidate package.")
    args = parser.parse_args()
    try:
        package = build(args.input, args.book_id)
    except RuntimeError as error:
        parser.error(str(error))
    if args.dry_run:
        print(json.dumps(package["stats"] | {"page": package["records"]["vocabulary"][0]["sourceRecord"]["page"] if package["records"]["vocabulary"] else None}, ensure_ascii=False))
        return 0
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), **package["stats"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
