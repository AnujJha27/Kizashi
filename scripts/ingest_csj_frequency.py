#!/usr/bin/env python3
"""Convert the published CSJ vocabulary table into review-only aggregates.

Only lemma, frequency, and per-million values are retained. The CSJ table is
not redistributed, and its aggregate values stay outside the learner bundle
until the exact downstream use is separately reviewed.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from collections import defaultdict
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any


SOURCE_ID = "csj-frequency"
REQUIRED_COLUMNS = {"lemma", "frequency", "pmw"}


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def checksum(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def number(value: Decimal) -> int | float:
    return int(value) if value == value.to_integral_value() else float(value)


def parse(path: Path, version: str) -> dict[str, Any]:
    aggregates: dict[str, dict[str, Decimal | int]] = defaultdict(lambda: {"frequency": 0, "pmw": Decimal("0"), "rowCount": 0})
    rows = 0
    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream, delimiter="\t")
        columns = set(reader.fieldnames or [])
        missing = sorted(REQUIRED_COLUMNS - columns)
        if missing:
            raise ValueError(f"CSJ table is missing required columns: {', '.join(missing)}")
        for row in reader:
            rows += 1
            lemma = (row.get("lemma") or "").strip()
            if not lemma:
                continue
            try:
                frequency = int((row.get("frequency") or "").strip())
                pmw = Decimal((row.get("pmw") or "0").strip())
            except (TypeError, ValueError, ArithmeticError) as error:
                raise ValueError(f"Invalid CSJ numeric value on row {rows + 1}.") from error
            if frequency < 0 or pmw < 0:
                raise ValueError(f"CSJ frequency values cannot be negative on row {rows + 1}.")
            aggregate = aggregates[lemma]
            aggregate["frequency"] += frequency
            aggregate["pmw"] += pmw
            aggregate["rowCount"] += 1

    retrieved_at = now()
    source = {
        "id": SOURCE_ID,
        "name": "CSJ spoken frequency list",
        "type": "frequency",
        "url": "https://repository.ninjal.ac.jp/records/3276",
        "license": "CC BY-NC-ND 3.0; free research/education use, no redistribution, commercial use by consultation.",
        "retrievedAt": retrieved_at,
        "sha256": checksum(path),
        "localFilename": path.name,
        "notes": "Aggregate signal only. Do not ship CSJ audio, transcripts, annotations, raw rows, or this source table.",
    }
    records = []
    for lemma, aggregate in sorted(aggregates.items(), key=lambda entry: (-int(entry[1]["frequency"]), entry[0])):
        records.append({
            "writtenForm": lemma,
            "spokenFrequency": int(aggregate["frequency"]),
            "spokenFrequencyMetadata": {
                "corpus": "CSJ",
                "version": version,
                "unit": "CSJ short-unit lemma",
                "register": "CSJ overall",
                "pmw": number(aggregate["pmw"]),
                "rowCount": int(aggregate["rowCount"]),
                "aggregation": "sum of published CSJ frequency rows sharing the lemma",
            },
            "sourceIds": [SOURCE_ID],
            "fieldSourceIds": {"spokenFrequency": [SOURCE_ID], "spokenFrequencyMetadata": [SOURCE_ID]},
            "reviewStatus": "pending",
        })
    return {
        "schemaVersion": 1,
        "status": "staged",
        "generatedAt": retrieved_at,
        "sourcePolicy": "CSJ frequency values are internal review inputs only; no redistribution, raw corpus content, audio, or automatic learner-bundle publication.",
        "sourceManifest": [source],
        "sources": [source],
        "records": {"vocabulary": records},
        "stats": {"rows": rows, "records": len(records)},
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True, help="CSJ tab-separated frequency table.")
    parser.add_argument("--output", type=Path, required=True, help="Review-only aggregate JSON output.")
    parser.add_argument("--version", default="2018.03.1")
    args = parser.parse_args()
    package = parse(args.input, args.version)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), "stats": package["stats"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
