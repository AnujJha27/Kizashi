#!/usr/bin/env python3
"""Validate a privacy-safe, aggregate-only I-JAS review input."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


ALLOWED_RECORD_FIELDS = {"pattern", "category", "count", "sourceReference", "notes"}


def text(value: Any, field: str, maximum: int) -> str:
    if not isinstance(value, str) or not value.strip() or len(value.strip()) > maximum:
        raise ValueError(f"{field} must be a non-empty string of at most {maximum} characters.")
    return value.strip()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    args = parser.parse_args()
    value = json.loads(args.input.read_text(encoding="utf-8"))
    records = value if isinstance(value, list) else value.get("records") if isinstance(value, dict) else None
    if not isinstance(records, list):
        raise ValueError("Expected a JSON array or an object containing records.")
    for index, record in enumerate(records, start=1):
        if not isinstance(record, dict):
            raise ValueError(f"Record {index} is not an object.")
        unknown = sorted(set(record) - ALLOWED_RECORD_FIELDS)
        if unknown:
            raise ValueError(f"Record {index} contains forbidden or unknown fields: {', '.join(unknown)}")
        text(record.get("pattern"), "pattern", 100)
        text(record.get("category"), "category", 100)
        text(record.get("sourceReference"), "sourceReference", 300)
        if not isinstance(record.get("count"), int) or isinstance(record.get("count"), bool) or record["count"] < 0:
            raise ValueError(f"Record {index} count must be a non-negative integer.")
        if "notes" in record:
            text(record["notes"], "notes", 500)
    print(json.dumps({"valid": True, "records": len(records)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, json.JSONDecodeError) as error:
        raise SystemExit(str(error))
