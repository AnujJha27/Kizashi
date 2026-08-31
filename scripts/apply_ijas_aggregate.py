#!/usr/bin/env python3
"""Attach reviewed, aggregate-only I-JAS signals to a local review package."""

from __future__ import annotations

import argparse
import json
import unicodedata
from pathlib import Path
from typing import Any


ALLOWED_RECORD_FIELDS = {"pattern", "category", "count", "sourceReference", "notes"}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def records(value: Any) -> list[dict[str, Any]]:
    candidate = value.get("records") if isinstance(value, dict) else value
    if not isinstance(candidate, list):
        raise ValueError("Expected a JSON array or an object containing records.")
    result: list[dict[str, Any]] = []
    for index, record in enumerate(candidate, start=1):
        if not isinstance(record, dict):
            raise ValueError(f"Record {index} is not an object.")
        unknown = sorted(set(record) - ALLOWED_RECORD_FIELDS)
        if unknown:
            raise ValueError(f"Record {index} contains forbidden or unknown fields: {', '.join(unknown)}")
        if not isinstance(record.get("pattern"), str) or not record["pattern"].strip():
            raise ValueError(f"Record {index} pattern must be a non-empty string.")
        if not isinstance(record.get("category"), str) or not record["category"].strip():
            raise ValueError(f"Record {index} category must be a non-empty string.")
        if not isinstance(record.get("sourceReference"), str) or not record["sourceReference"].strip():
            raise ValueError(f"Record {index} sourceReference must be a non-empty string.")
        if not isinstance(record.get("count"), int) or isinstance(record["count"], bool) or record["count"] < 0:
            raise ValueError(f"Record {index} count must be a non-negative integer.")
        result.append({key: value.strip() if isinstance(value, str) else value for key, value in record.items()})
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--package", type=Path, required=True)
    parser.add_argument("--input", type=Path, required=True, help="Validated I-JAS aggregate JSON.")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    package = read_json(args.package)
    if not isinstance(package, dict):
        raise ValueError("The content package must be a JSON object.")
    incoming = records(read_json(args.input))
    existing = package.get("learnerErrorAggregates", [])
    existing_records = records(existing) if existing else []
    merged: dict[tuple[str, str], dict[str, Any]] = {}
    for record in [*existing_records, *incoming]:
        key = (unicodedata.normalize("NFKC", record["pattern"]), record["category"])
        if key in merged and merged[key]["count"] != record["count"]:
            raise ValueError(f"Conflicting I-JAS aggregate for {record['pattern']} / {record['category']}.")
        merged[key] = record
    package["learnerErrorAggregates"] = sorted(merged.values(), key=lambda record: (record["category"], record["pattern"]))
    package["learnerErrorAggregatePolicy"] = "Aggregate-only I-JAS review signals; no learner IDs, transcripts, audio, or raw records. Corpus evidence is not a grammar authority."
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), "records": len(package["learnerErrorAggregates"])}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, json.JSONDecodeError) as error:
        raise SystemExit(str(error))
