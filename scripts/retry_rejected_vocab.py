#!/usr/bin/env python3
"""Retry the six audited vocabulary extraction failures without opening the publish gate."""

from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path
from typing import Any

from ingest_marugoto_vocab import candidate
from ingest_openjlpt import jmdict_index, text


TARGET_IDS = {
    "openjlpt-vocabulary-cd2f86eedfd9",
    "marugoto-starter-vocab-7ddb68d985db",
    "marugoto-starter-vocab-cee10e7167df",
    "marugoto-starter-vocab-0a5e23e8d9b2",
    "marugoto-elementary1-vocab-666d51b66503",
    "marugoto-elementary1-vocab-32738872e84f",
}
MARUGOTO_SOURCES = {
    "marugoto-starter-vocab",
    "marugoto-elementary1-vocab",
    "marugoto-elementary2-vocab",
}


def strings(value: Any) -> list[str]:
    return [entry.strip() for entry in value if isinstance(entry, str) and entry.strip()] if isinstance(value, list) else []


def unique(values: list[str]) -> list[str]:
    return list(dict.fromkeys(value for value in values if value))


def kana_key(value: Any) -> str:
    return text(value).translate(str.maketrans({chr(code): chr(code - 0x60) for code in range(0x30A1, 0x30F7)}))


def source_id_for(item: dict[str, Any]) -> str:
    prefix = text(item.get("id")).rsplit("-", 1)[0]
    if prefix in MARUGOTO_SOURCES:
        return prefix
    return next((source for source in strings(item.get("sourceIds")) if source.startswith("marugoto-")), "marugoto-source-review")


def source_record(item: dict[str, Any]) -> dict[str, Any]:
    record = item.get("sourceRecord")
    if isinstance(record, dict):
        return record
    for entry in item.get("sourceRecords", []):
        if isinstance(entry, dict) and isinstance(entry.get("record"), dict):
            return entry["record"]
    return {}


def provenance_entries(item: dict[str, Any], source_id: str) -> list[dict[str, Any]]:
    entries = [entry for entry in item.get("sourceRecords", []) if isinstance(entry, dict) and isinstance(entry.get("record"), dict)]
    record = source_record(item)
    if record and not any(entry.get("record") == record for entry in entries):
        entries.append({"sourceId": source_id, "record": record})
    return entries


def merge_provenance(target: dict[str, Any], item: dict[str, Any], source_ids: list[str], source_id: str) -> None:
    target["sourceIds"] = unique([*strings(target.get("sourceIds")), *source_ids])
    existing = target.get("sourceRecords") if isinstance(target.get("sourceRecords"), list) else []
    known = {(entry.get("sourceId"), json.dumps(entry.get("record"), ensure_ascii=False, sort_keys=True)) for entry in existing if isinstance(entry, dict)}
    for entry in provenance_entries(item, source_id):
        key = (entry.get("sourceId"), json.dumps(entry.get("record"), ensure_ascii=False, sort_keys=True))
        if key not in known:
            existing.append(copy.deepcopy(entry))
            known.add(key)
    if existing:
        target["sourceRecords"] = existing

    field_sources = target.get("fieldSourceIds") if isinstance(target.get("fieldSourceIds"), dict) else {}
    for field, values in item.get("fieldSourceIds", {}).items() if isinstance(item.get("fieldSourceIds"), dict) else []:
        field_sources[field] = unique([*strings(field_sources.get(field)), *strings(values)])
    if field_sources:
        target["fieldSourceIds"] = field_sources

    classification = item.get("classification")
    if isinstance(classification, dict) and not isinstance(target.get("classification"), dict):
        target["classification"] = {**classification, "itemId": target.get("id")}


def canonical_match(vocabulary: list[dict[str, Any]], item: dict[str, Any], removed: set[str]) -> dict[str, Any] | None:
    written = text(item.get("writtenForm"))
    reading = kana_key(item.get("reading"))
    matches = [
        candidate_item
        for candidate_item in vocabulary
        if text(candidate_item.get("id")) not in removed
        and text(candidate_item.get("writtenForm")) == written
        and kana_key(candidate_item.get("reading")) == reading
        and text(candidate_item.get("reviewStatus")) != "rejected"
    ]
    return min(matches, key=lambda value: ("source-review" in strings(value.get("tags")), text(value.get("id")))) if matches else None


def retry_openjlpt(item: dict[str, Any]) -> dict[str, Any]:
    fixed = copy.deepcopy(item)
    raw = item.get("sourceRecord") if isinstance(item.get("sourceRecord"), dict) else {}
    fixed["reading"] = text(raw.get("reading")) or text(item.get("writtenForm"))
    meanings = strings(raw.get("meanings"))
    if text(item.get("writtenForm")) == "いくら" and meanings:
        fixed["meanings"] = ["how much"]
    elif meanings:
        fixed["meanings"] = meanings
    fixed["notes"] = "Retried: restored the source reading and meaning; merged as evidence into the canonical vocabulary item."
    return fixed


def retry_marugoto(item: dict[str, Any], dictionary: dict[tuple[str, str], dict[str, Any]]) -> dict[str, Any]:
    record = source_record(item)
    line = text(record.get("line"))
    line_number = record.get("lineNumber") if isinstance(record.get("lineNumber"), int) else 0
    fixed = candidate(line, line_number, source_id_for(item), dictionary)
    if not fixed:
        raise ValueError(f"Could not retry {item.get('id')} from its source line.")
    fixed["id"] = item["id"]
    fixed["slug"] = item.get("slug") or item["id"]
    fixed["reviewStatus"] = "pending"
    fixed["sourceIds"] = unique([*strings(item.get("sourceIds")), *strings(fixed.get("sourceIds"))])
    fixed["notes"] = "Retried: restored the full Marugoto reading; still pending normal enrichment and lesson review."
    return fixed


def remove_ids_from_lessons(package: dict[str, Any], removed: set[str]) -> None:
    course = package.get("course") if isinstance(package.get("course"), dict) else {}
    for chapter in course.get("chapters", []) if isinstance(course.get("chapters"), list) else []:
        for lesson in chapter.get("lessons", []) if isinstance(chapter, dict) and isinstance(chapter.get("lessons"), list) else []:
            if isinstance(lesson, dict) and isinstance(lesson.get("itemIds"), list):
                lesson["itemIds"] = [item_id for item_id in strings(lesson["itemIds"]) if item_id not in removed]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--package", type=Path, default=Path("data/staging/kizashi-n5-source-review.json"))
    parser.add_argument("--jmdict", type=Path, default=Path("data/source-cache/JMdict_e.gz"))
    parser.add_argument("--output", type=Path, default=Path("data/staging/kizashi-n5-source-review.json"))
    args = parser.parse_args()

    package = json.loads(args.package.read_text(encoding="utf-8"))
    vocabulary = [item for item in package.get("vocabulary", []) if isinstance(item, dict)]
    dictionary = jmdict_index(args.jmdict) if args.jmdict.is_file() else {}
    removed: set[str] = set()
    merged = 0
    added = 0
    added_ids: list[str] = []
    fixed_items: list[dict[str, Any]] = []
    for item in vocabulary:
        item_id = text(item.get("id"))
        if item_id not in TARGET_IDS:
            fixed_items.append(item)
            continue
        removed.add(item_id)
        fixed = retry_openjlpt(item) if item_id.startswith("openjlpt-") else retry_marugoto(item, dictionary)
        target = canonical_match(vocabulary, fixed, removed)
        if target:
            source_ids = [source for source in strings(item.get("sourceIds")) if source.startswith("openjlpt") or source.startswith("marugoto-")]
            merge_provenance(target, item, source_ids, source_ids[0] if source_ids else "source-review")
            merged += 1
            continue
        fixed_items.append(fixed)
        added_ids.append(item_id)
        added += 1

    package["vocabulary"] = fixed_items
    remove_ids_from_lessons(package, removed)
    course = package.get("course") if isinstance(package.get("course"), dict) else {}
    review_lessons = [
        lesson
        for chapter in course.get("chapters", []) if isinstance(course.get("chapters"), list) and isinstance(chapter, dict)
        for lesson in chapter.get("lessons", []) if isinstance(chapter.get("lessons"), list) and isinstance(lesson, dict)
        if lesson.get("id") == "lesson-openjlpt-review"
    ]
    if review_lessons:
        review_lessons[0]["itemIds"] = unique([*strings(review_lessons[0].get("itemIds")), *added_ids])

    stats = package.get("stagingStats") if isinstance(package.get("stagingStats"), dict) else {}
    if stats:
        stats["vocabulary"] = max(0, int(stats.get("vocabulary", 0)) - len(removed) + added)
        stats["total"] = stats.get("vocabulary", 0) + stats.get("kanji", 0) + stats.get("grammar", 0)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), "processed": len(removed), "merged": merged, "added": added}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
