#!/usr/bin/env python3
"""Stage Sudachi morphology data without treating it as learner content."""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, TextIO


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def checksum(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def value(row: dict[str, Any], *names: str) -> str:
    for name in names:
        candidate = row.get(name)
        if isinstance(candidate, str) and candidate.strip():
            return candidate.strip()
    return ""


def read_rows(stream: TextIO, delimiter: str) -> Iterable[dict[str, Any]]:
    yield from csv.DictReader(stream, delimiter=delimiter)


def rows_from(path: Path) -> tuple[list[dict[str, Any]], list[str]]:
    rows: list[dict[str, Any]] = []
    members: list[str] = []
    if path.suffix.lower() == ".zip":
        with zipfile.ZipFile(path) as archive:
            members = archive.namelist()
            candidates = [name for name in members if name.lower().endswith((".tsv", ".csv"))]
            for name in candidates:
                delimiter = "\t" if name.lower().endswith(".tsv") else ","
                with archive.open(name) as raw, io.TextIOWrapper(raw, encoding="utf-8", errors="replace") as stream:
                    rows.extend(read_rows(stream, delimiter))
        return rows, members

    delimiter = "\t" if path.suffix.lower() in {".tsv", ".txt"} else ","
    with path.open(encoding="utf-8", errors="replace", newline="") as stream:
        rows.extend(read_rows(stream, delimiter))
    return rows, members


def parse(path: Path, source_id: str) -> tuple[list[dict[str, Any]], list[str]]:
    raw_rows, members = rows_from(path)
    records: list[dict[str, Any]] = []
    seen: set[str] = set()
    for row in raw_rows:
        surface = value(row, "surface", "word", "form")
        lemma = value(row, "lemma", "dictionaryForm", "dictionary_form") or surface
        reading = value(row, "reading", "yomi")
        part_of_speech = value(row, "partOfSpeech", "part_of_speech", "pos")
        if not surface or not lemma:
            continue
        key = "|".join((surface, lemma, reading, part_of_speech))
        if key in seen:
            continue
        seen.add(key)
        record_id = f"{source_id}-{hashlib.sha1(key.encode('utf-8')).hexdigest()[:12]}"
        records.append({
            "id": record_id,
            "slug": record_id,
            "title": surface,
            "reviewStatus": "pending",
            "subcategory": "morphology",
            "sourceIds": [source_id],
            "tags": ["sudachi", "source-review"],
            "surface": surface,
            "lemma": lemma,
            "reading": reading,
            "partOfSpeech": part_of_speech,
            "sourceRecord": {"surface": surface, "lemma": lemma, "reading": reading, "partOfSpeech": part_of_speech},
        })
    return records, members


def build(path: Path, source_id: str) -> dict[str, Any]:
    retrieved_at = now()
    records, members = parse(path, source_id)
    source = {
        "id": source_id,
        "name": "SudachiDict",
        "type": "dictionary",
        "license": "SudachiDict licence; verify terms before use.",
        "retrievedAt": retrieved_at,
        "sha256": checksum(path),
        "localFilename": path.name,
        "notes": "Morphology and sentence-linking enrichment only; not JLPT curriculum truth.",
    }
    if members:
        source["archiveMembers"] = members
    return {
        "schemaVersion": 1,
        "status": "staged",
        "generatedAt": retrieved_at,
        "sourcePolicy": "Sudachi data is lookup-only. Verify license and canonical facts before deriving learner content.",
        "sourceManifest": [source],
        "sources": [source],
        "records": {"morphology": records},
        "stats": {"morphology": len(records)},
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--source-id", default="sudachi-dictionary")
    parser.add_argument("--output", type=Path, default=Path("data/staging/sudachi-morphology.json"))
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    package = build(args.input, args.source_id)
    if args.dry_run:
        print(json.dumps(package["stats"], ensure_ascii=False))
        return 0
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), **package["stats"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
