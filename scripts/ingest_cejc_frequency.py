#!/usr/bin/env python3
"""Convert CEJC's frequency table into review-only aggregate signals.

The output contains one aggregate per UniDic orthBase. It intentionally drops
CEJC strata and corpus rows, and must stay outside the learner bundle.
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


SOURCE_ID = "cejc-frequency"
REQUIRED_COLUMNS = {"UniDic:orthBase", "frequency", "pmw"}


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
            raise ValueError(f"CEJC table is missing required columns: {', '.join(missing)}")
        for row in reader:
            rows += 1
            written_form = (row.get("UniDic:orthBase") or "").strip()
            if not written_form:
                continue
            try:
                frequency = int((row.get("frequency") or "").strip())
                pmw = Decimal((row.get("pmw") or "0").strip())
            except (TypeError, ValueError, ArithmeticError) as error:
                raise ValueError(f"Invalid CEJC numeric value on row {rows + 1}.") from error
            if frequency < 0 or pmw < 0:
                raise ValueError(f"CEJC frequency values cannot be negative on row {rows + 1}.")
            aggregate = aggregates[written_form]
            aggregate["frequency"] += frequency
            aggregate["pmw"] += pmw
            aggregate["rowCount"] += 1

    retrieved_at = now()
    source = {
        "id": SOURCE_ID,
        "name": "CEJC spoken frequency aggregate",
        "type": "frequency",
        "url": "https://repository.ninjal.ac.jp/records/2000167",
        "license": "CEJC-WSD-frequency; free research/education use, no redistribution, commercial use by consultation.",
        "retrievedAt": retrieved_at,
        "sha256": checksum(path),
        "localFilename": path.name,
        "notes": "Aggregate signal only. Do not ship CEJC audio, transcripts, annotations, or raw rows.",
    }
    records = []
    for written_form, aggregate in sorted(aggregates.items(), key=lambda entry: (-int(entry[1]["frequency"]), entry[0])):
        records.append({
            "writtenForm": written_form,
            "spokenFrequency": int(aggregate["frequency"]),
            "spokenFrequencyMetadata": {
                "corpus": "CEJC",
                "version": version,
                "unit": "UniDic:orthBase",
                "pmw": number(aggregate["pmw"]),
                "rowCount": int(aggregate["rowCount"]),
                "aggregation": "sum of CEJC frequency and pmw across source strata",
            },
            "sourceIds": [SOURCE_ID],
            "fieldSourceIds": {"spokenFrequency": [SOURCE_ID], "spokenFrequencyMetadata": [SOURCE_ID]},
            "reviewStatus": "pending",
        })
    return {
        "schemaVersion": 1,
        "status": "staged",
        "generatedAt": retrieved_at,
        "sourcePolicy": "CEJC is an analysis input only. Review aggregate values before applying them to canonical vocabulary; never publish corpus rows or raw CEJC content.",
        "sourceManifest": [source],
        "sources": [source],
        "records": {"vocabulary": records},
        "stats": {"rows": rows, "records": len(records)},
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True, help="CEJC tab-separated frequency table.")
    parser.add_argument("--output", type=Path, required=True, help="Review-only aggregate JSON output.")
    parser.add_argument("--version", default="2024.03")
    args = parser.parse_args()
    package = parse(args.input, args.version)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), "stats": package["stats"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
