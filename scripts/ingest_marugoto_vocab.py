#!/usr/bin/env python3
"""Stage Marugoto vocabulary-index candidates for human review.

Marugoto publishes vocabulary indexes as PDFs. This adapter extracts text with
the system ``pdftotext`` utility, keeps the original line as provenance, and
only emits rows with an explicit Japanese form, reading, and translation.
"""

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

from ingest_openjlpt import file_checksum, jmdict_index, text


SOURCE_URLS = {
    "marugoto-starter-vocabulary-index-en.pdf": ("marugoto-starter-vocab", "Marugoto Starter vocabulary index"),
    "marugoto-elementary1-vocabulary-index-en.pdf": ("marugoto-elementary1-vocab", "Marugoto Elementary 1 vocabulary index"),
    "marugoto-elementary2-vocabulary-index-en.pdf": ("marugoto-elementary2-vocab", "Marugoto Elementary 2 vocabulary index"),
}
JAPANESE = re.compile(r"[ぁ-んァ-ヶ一-龯々ー・]+")
KANA = re.compile(r"^[ぁ-んァ-ヶー・]+$")


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def stable_id(source_id: str, written: str, reading: str, line_number: int) -> str:
    digest = hashlib.sha1(f"{source_id}|{written}|{reading}|{line_number}".encode("utf-8")).hexdigest()[:12]
    return f"{source_id}-{digest}"


def extracted_text(path: Path) -> str:
    if path.suffix.lower() in {".txt", ".tsv", ".csv"}:
        return path.read_text(encoding="utf-8", errors="replace")
    executable = shutil.which("pdftotext")
    if not executable:
        raise RuntimeError("Marugoto PDF import requires pdftotext on PATH.")
    result = subprocess.run([executable, "-layout", str(path), "-"], check=True, capture_output=True, text=True, encoding="utf-8", errors="replace")
    return result.stdout


def source_for(path: Path) -> tuple[str, str]:
    return SOURCE_URLS.get(path.name, (f"marugoto-{path.stem}", f"Marugoto vocabulary index · {path.stem}"))


def candidate(line: str, line_number: int, source_id: str, dictionary: dict[tuple[str, str], dict[str, Any]]) -> dict[str, Any] | None:
    raw = " ".join(line.split())
    if not raw or not JAPANESE.search(raw) or raw.isdigit():
        return None
    runs = list(JAPANESE.finditer(raw))
    if not runs:
        return None
    written = runs[0].group(0).strip("・")
    if not written or written.isdigit() or len(written) > 32:
        return None
    reading = ""
    if len(runs) > 1 and KANA.fullmatch(runs[1].group(0)):
        reading = runs[1].group(0)
    if not KANA.fullmatch(written):
        match = dictionary.get((written, ""))
        reading = reading or (match.get("readings", [""])[0] if match else "")
    else:
        reading = reading or written
    english_start = runs[-1].end()
    meaning = raw[english_start:].strip(" -:|·")
    if not reading or not meaning or not re.search(r"[A-Za-z]", meaning):
        return None
    match = dictionary.get((written, reading)) or dictionary.get((written, ""))
    item_id = stable_id(source_id, written, reading, line_number)
    item: dict[str, Any] = {
        "id": item_id,
        "slug": item_id,
        "title": written,
        "jlptLevel": None,
        "category": "vocabulary",
        "reviewStatus": "pending",
        "subcategory": "marugoto",
        "difficulty": 2,
        "prerequisiteIds": [],
        "tags": ["marugoto", "source-review"],
        "sourceIds": [source_id],
        "writtenForm": written,
        "reading": reading,
        "meanings": [meaning],
        "partOfSpeech": "source record",
        "exampleSentences": [],
        "collocations": [],
        "relatedWords": [],
        "antonyms": [],
        "notes": "Marugoto vocabulary reference; review the extracted columns and lesson placement before publishing.",
        "sourceRecord": {"line": line.rstrip("\r\n"), "lineNumber": line_number},
    }
    if match:
        item["dictionary"] = match
        item["sourceIds"].append("jmdict")
    return item


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", action="append", type=Path, required=True, help="Marugoto PDF or extracted text file; repeat for each level.")
    parser.add_argument("--jmdict", type=Path, default=Path("data/source-cache/JMdict_e.gz"))
    parser.add_argument("--output", type=Path, default=Path("data/staging/marugoto-vocabulary.json"))
    args = parser.parse_args()

    retrieved_at = now()
    dictionary = jmdict_index(args.jmdict) if args.jmdict.is_file() else {}
    vocabulary: list[dict[str, Any]] = []
    sources: list[dict[str, Any]] = []
    seen: set[tuple[str, str, str]] = set()
    for path in args.input:
        source_id, name = source_for(path)
        text_value = extracted_text(path)
        source = {"id": source_id, "name": name, "type": "curriculum", "url": "https://marugoto.jpf.go.jp/en/download/", "license": "Japan Foundation official material; verify current terms before publishing.", "retrievedAt": retrieved_at, "sha256": file_checksum(path), "localFilename": path.name, "notes": "Extracted vocabulary candidates are staging-only and require review."}
        sources.append(source)
        for line_number, line in enumerate(text_value.splitlines(), 1):
            item = candidate(line, line_number, source_id, dictionary)
            if not item:
                continue
            key = (item["writtenForm"], item["reading"], item["meanings"][0])
            if key in seen:
                continue
            seen.add(key)
            vocabulary.append(item)

    package = {
        "schemaVersion": 1,
        "status": "staged",
        "generatedAt": retrieved_at,
        "sourcePolicy": "Marugoto rows are extraction candidates; review the source line and lesson fit before publishing.",
        "sources": sources,
        "records": {"vocabulary": vocabulary, "kanji": [], "grammar": [], "tatoebaExamples": []},
        "stats": {"vocabulary": len(vocabulary), "kanji": 0, "grammar": 0, "tatoebaExamples": 0},
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), "stats": package["stats"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
