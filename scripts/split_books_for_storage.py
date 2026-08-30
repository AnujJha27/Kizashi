#!/usr/bin/env python3
"""Split private PDFs into Supabase Free-compatible Storage parts."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from typing import Any


MAX_PART_BYTES = 50 * 1024 * 1024
DEFAULT_PART_BYTES = 45 * 1024 * 1024
BOOK_ID = re.compile(r"^[a-z0-9][a-z0-9-]*$")


def digest(path: Path) -> str:
    checksum = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            checksum.update(chunk)
    return checksum.hexdigest()


def split_book(input_path: Path, book_id: str, output_dir: Path, part_bytes: int) -> dict[str, Any]:
    if not BOOK_ID.fullmatch(book_id):
        raise ValueError("book-id must contain only lowercase letters, numbers, and hyphens")
    if part_bytes <= 0 or part_bytes >= MAX_PART_BYTES:
        raise ValueError("part-size must be greater than 0 and less than 50 MiB")
    if not input_path.is_file():
        raise FileNotFoundError(input_path)

    part_dir = output_dir / "books" / book_id
    part_dir.mkdir(parents=True, exist_ok=True)
    parts: list[dict[str, Any]] = []
    with input_path.open("rb") as source:
        index = 0
        while chunk := source.read(part_bytes):
            part_path = part_dir / f"part-{index:03d}.pdf"
            part_path.write_bytes(chunk)
            parts.append({"path": part_path.relative_to(output_dir).as_posix(), "bytes": len(chunk), "sha256": digest(part_path)})
            index += 1

    return {"bookId": book_id, "source": str(input_path), "sourceBytes": input_path.stat().st_size, "sourceSha256": digest(input_path), "partCount": len(parts), "parts": parts}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--book-id", required=True)
    parser.add_argument("--output-dir", type=Path, default=Path(".book-storage"))
    parser.add_argument("--part-size-mb", type=float, default=DEFAULT_PART_BYTES / (1024 * 1024))
    args = parser.parse_args()

    part_bytes = int(args.part_size_mb * 1024 * 1024)
    book = split_book(args.input, args.book_id, args.output_dir, part_bytes)
    manifest_path = args.output_dir / "books-manifest.json"
    manifest: dict[str, Any] = {"schemaVersion": 1, "partSizeBytes": part_bytes, "books": []}
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["schemaVersion"] = 1
    manifest["partSizeBytes"] = part_bytes
    manifest["books"] = [entry for entry in manifest.get("books", []) if entry.get("bookId") != args.book_id]
    manifest["books"].append(book)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"manifest": str(manifest_path), "bookId": args.book_id, "partCount": book["partCount"], "sourceBytes": book["sourceBytes"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
