#!/usr/bin/env python3
"""Build a metadata-only Irodori activity/resource manifest for review."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SOURCE_ID = "irodori"
TERMS_URL = "https://www.irodori.jpf.go.jp/en/faq.html"
DEFAULT_SOURCE_URL = "https://www.irodori.jpf.go.jp/en/resources.html"


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def text(value: Any) -> str:
    return value.strip() if isinstance(value, str) else ""


def course_level(course: str) -> str:
    return {
        "入門": "A1",
        "初級1": "A2",
        "初級2": "A2",
        "準中級": "B1",
    }.get(course, "")


def ids_by_prefix(ids: list[str], prefix: str) -> list[str]:
    return [value for value in ids if value.startswith(prefix)]


def resource(entry: dict[str, Any], retrieved_at: str) -> dict[str, Any]:
    audio = entry.get("audio") if isinstance(entry.get("audio"), dict) else {}
    terms = entry.get("terms") if isinstance(entry.get("terms"), dict) else {}
    target_ids = [value.strip() for value in entry.get("targetItemIds", []) if isinstance(value, str) and value.strip()]
    activity_types = [value.strip() for value in entry.get("activityTypes", []) if isinstance(value, str) and value.strip()]
    if not activity_types:
        activity_types = ["listening", "dialogue", "shadowing", "real-life-task"]
    source_url = text(entry.get("url")) or DEFAULT_SOURCE_URL
    return {
        "id": text(entry.get("id")),
        "sourceId": SOURCE_ID,
        "provider": SOURCE_ID,
        "course": text(entry.get("course")),
        "courseLevel": course_level(text(entry.get("course"))),
        "lesson": text(entry.get("lesson")),
        "canDo": text(entry.get("canDo")),
        "sourcePageUrl": source_url,
        "url": source_url,
        "activityTypes": activity_types,
        "resourceTypes": [value.strip() for value in entry.get("resourceTypes", []) if isinstance(value, str) and value.strip()],
        "audio": {
            "available": bool(audio.get("available")),
            "delivery": "provider-hosted",
            **({"url": text(audio.get("url"))} if text(audio.get("url")) else {}),
        },
        "targetItemIds": target_ids,
        "targetGrammarIds": ids_by_prefix(target_ids, "grammar-"),
        "targetVocabularyIds": ids_by_prefix(target_ids, "vocab-"),
        "targetKanjiIds": ids_by_prefix(target_ids, "kanji-"),
        "terms": {
            "url": text(terms.get("url")) or TERMS_URL,
            "retrievedAt": text(terms.get("retrievedAt")) or retrieved_at,
        },
        "reviewStatus": "pending",
        "provenance": {
            "sourceId": SOURCE_ID,
            "sourceUrl": source_url,
            "retrievedAt": retrieved_at,
            "termsUrl": text(terms.get("url")) or TERMS_URL,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=Path("data/source-cache/irodori-resources.json"))
    parser.add_argument("--output", type=Path, default=Path("data/staging/irodori-resources.json"))
    args = parser.parse_args()
    retrieved_at = now()
    raw = json.loads(args.input.read_text(encoding="utf-8"))
    entries = raw.get("resources", []) if isinstance(raw, dict) else raw
    if not isinstance(entries, list):
        raise ValueError("Irodori resource input must be a list or an object with resources.")
    records = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        item = resource(entry, retrieved_at)
        if not item["id"] or not item["course"] or not item["lesson"] or not item["canDo"]:
            continue
        records.append(item)
    package = {
        "schemaVersion": 1,
        "status": "staged",
        "generatedAt": retrieved_at,
        "sourceManifest": [{"id": SOURCE_ID, "name": "Japan Foundation Irodori", "type": "curriculum", "url": DEFAULT_SOURCE_URL, "retrievedAt": retrieved_at, "notes": "Official lesson/resource metadata only; media remains provider-hosted."}],
        "records": records,
        "stats": {"resources": len(records)},
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), "stats": package["stats"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
