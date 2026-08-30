#!/usr/bin/env python3
"""Stage JMnedict proper names for lookup; never add them to JLPT vocabulary."""

from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def checksum(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse(path: Path, source_id: str) -> list[dict[str, Any]]:
    opener = gzip.open if path.suffix == ".gz" else open
    with opener(path, "rb") as source:
        root = ET.parse(source).getroot()
    records: list[dict[str, Any]] = []
    for entry in root.findall("entry"):
        sequence = entry.findtext("ent_seq", "").strip()
        written = [value.text.strip() for value in entry.findall("k_ele/keb") if value.text and value.text.strip()]
        readings = [value.text.strip() for value in entry.findall("r_ele/reb") if value.text and value.text.strip()]
        meanings = [value.text.strip() for value in entry.findall("trans/trans_det") if value.text and value.text.strip()]
        if not sequence or not written or not readings:
            continue
        records.append({"id": f"jmnedict-{sequence}", "nameType": "proper", "writtenForms": written, "readings": readings, "meanings": meanings, "sourceIds": [source_id], "sourceRecord": {"entSeq": sequence}})
    return records


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("data/staging/jmnedict-names.json"))
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    source_id = "jmnedict"
    records = parse(args.input, source_id)
    source = {"id": source_id, "name": "JMnedict", "type": "dictionary", "license": "EDRDG licence", "retrievedAt": now(), "sha256": checksum(args.input), "localFilename": args.input.name}
    package = {"schemaVersion": 1, "status": "staged", "generatedAt": now(), "sourcePolicy": "Proper names are lookup-only and must not enter the JLPT learner vocabulary.", "sourceManifest": [source], "sources": [source], "records": {"properNames": records}, "stats": {"properNames": len(records)}}
    if args.dry_run:
        print(json.dumps(package["stats"], ensure_ascii=False))
        return 0
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), **package["stats"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
