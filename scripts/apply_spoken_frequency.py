#!/usr/bin/env python3
"""Apply reviewed spoken-frequency aggregates to a local content package."""

from __future__ import annotations

import argparse
import json
import unicodedata
from pathlib import Path
from typing import Any


def read_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"Expected an object in {path}.")
    return value


def text(value: Any) -> str:
    return value.strip() if isinstance(value, str) else ""


def strings(value: Any) -> list[str]:
    return [entry.strip() for entry in value if isinstance(entry, str) and entry.strip()] if isinstance(value, list) else []


def key(value: Any) -> str:
    return unicodedata.normalize("NFKC", text(value))


def add_source(item: dict[str, Any], field: str, source_id: str) -> None:
    source_ids = strings(item.get("sourceIds"))
    item["sourceIds"] = list(dict.fromkeys([*source_ids, source_id]))
    field_sources = item.get("fieldSourceIds") if isinstance(item.get("fieldSourceIds"), dict) else {}
    field_sources[field] = list(dict.fromkeys([*strings(field_sources.get(field)), source_id]))
    item["fieldSourceIds"] = field_sources


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--package", type=Path, required=True)
    parser.add_argument("--frequency", type=Path, required=True, help="Output from ingest_cejc_frequency.py after review.")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--publish-private", action="store_true", help="Authorize CSJ aggregate values for the private allowlisted learner package.")
    args = parser.parse_args()

    package = read_json(args.package)
    frequency_package = read_json(args.frequency)
    manifest = frequency_package.get("sourceManifest")
    source = next((entry for entry in manifest if isinstance(entry, dict) and text(entry.get("id"))), None) if isinstance(manifest, list) else None
    if not source:
        raise ValueError("Frequency package has no source manifest entry.")
    source_id = text(source.get("id"))
    if args.publish_private and source_id != "csj-frequency":
        raise ValueError("--publish-private is only valid for CSJ aggregate values.")
    if source_id == "csj-frequency" and not args.publish_private:
        raise ValueError("CSJ values remain staged; pass --publish-private after owner authorization.")
    records = frequency_package.get("records")
    records = records.get("vocabulary") if isinstance(records, dict) else None
    if not isinstance(records, list):
        raise ValueError("Frequency package has no vocabulary records.")

    by_form: dict[str, dict[str, Any]] = {}
    for record in records:
        if not isinstance(record, dict) or not key(record.get("writtenForm")):
            raise ValueError("Every spoken-frequency record needs a writtenForm.")
        written_form = key(record["writtenForm"])
        if written_form in by_form and by_form[written_form].get("spokenFrequency") != record.get("spokenFrequency"):
            raise ValueError(f"Conflicting spoken-frequency records for {written_form}.")
        by_form[written_form] = record

    matched = 0
    conflicts = 0
    for item in package.get("vocabulary", []):
        if not isinstance(item, dict):
            continue
        record = by_form.get(key(item.get("writtenForm")))
        if not record:
            continue
        existing = item.get("spokenFrequency")
        incoming = record.get("spokenFrequency")
        if existing is not None and existing != incoming:
            conflicts += 1
            continue
        item["spokenFrequency"] = incoming
        if isinstance(record.get("spokenFrequencyMetadata"), dict):
            item["spokenFrequencyMetadata"] = record["spokenFrequencyMetadata"]
        add_source(item, "spokenFrequency", source_id)
        if isinstance(record.get("spokenFrequencyMetadata"), dict):
            add_source(item, "spokenFrequencyMetadata", source_id)
        matched += 1
    if conflicts:
        raise ValueError(f"Refusing to overwrite {conflicts} existing spoken-frequency values.")

    existing_manifest = package.get("sourceManifest") if isinstance(package.get("sourceManifest"), list) else []
    package["sourceManifest"] = [*existing_manifest, source] if source_id not in {text(entry.get("id")) for entry in existing_manifest if isinstance(entry, dict)} else existing_manifest
    package.setdefault("spokenFrequencyImport", {})
    package["spokenFrequencyImport"] = {"sourceId": source_id, "matchedVocabulary": matched, "candidateRecords": len(records), "status": "private-published" if args.publish_private else "staged", "audience": "private-allowlisted" if args.publish_private else "review-only"}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), "matchedVocabulary": matched, "candidateRecords": len(records)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
