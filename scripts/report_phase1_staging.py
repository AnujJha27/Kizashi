#!/usr/bin/env python3
"""Report coverage and enrichment gaps in a Kizashi staging package."""

from __future__ import annotations

import argparse
import gzip
import json
from collections import Counter
from pathlib import Path
from typing import Any


CATEGORIES = ("vocabulary", "kanji", "grammar", "readings", "listening")


def read_package(path: Path) -> dict[str, Any]:
    opener = gzip.open if path.suffix == ".gz" else open
    with opener(path, "rt", encoding="utf-8") as stream:
        value = json.load(stream)
    if not isinstance(value, dict):
        raise ValueError(f"Expected an object in {path}.")
    return value


def items(package: dict[str, Any], category: str) -> list[dict[str, Any]]:
    return [item for item in package.get(category, []) if isinstance(item, dict)]


def string_list(value: Any) -> list[str]:
    return [entry.strip() for entry in value if isinstance(entry, str) and entry.strip()] if isinstance(value, list) else []


def has_examples(item: dict[str, Any], key: str) -> bool:
    value = item.get(key)
    return any(isinstance(example, dict) and isinstance(example.get("japanese"), str) and example["japanese"].strip() and isinstance(example.get("translation"), str) and example["translation"].strip() for example in value) if isinstance(value, list) else False


def gap_fields(total: int, enrichment: dict[str, int]) -> list[str]:
    if not total:
        return list(enrichment)
    return [field for field, count in enrichment.items() if count < total]


def report(package: dict[str, Any]) -> dict[str, Any]:
    category_report: dict[str, Any] = {}
    source_counts: Counter[str] = Counter()
    topic_counts: Counter[str] = Counter()
    level_counts: Counter[str] = Counter()
    band_counts: Counter[str] = Counter()
    course = package.get("course") if isinstance(package.get("course"), dict) else {}
    manifest_ids = {source.get("id").strip() for source in package.get("sourceManifest", []) if isinstance(source, dict) and isinstance(source.get("id"), str) and source.get("id").strip()}
    lesson_item_ids = {
        str(item_id)
        for chapter in course.get("chapters", [])
        if isinstance(chapter, dict)
        for lesson in chapter.get("lessons", [])
        if isinstance(lesson, dict)
        for item_id in string_list(lesson.get("itemIds"))
        if isinstance(item_id, str) and item_id.strip()
    }

    for category in CATEGORIES:
        category_items = items(package, category)
        statuses = Counter(str(item.get("reviewStatus") or "approved") for item in category_items)
        for item in category_items:
            source_counts.update(string_list(item.get("sourceIds")))
            topic_counts.update(tag for tag in string_list(item.get("tags")) if tag != "source-review")
            level_counts.update([str(item.get("jlptLevel") or "unclassified")])
            classification = item.get("classification") if isinstance(item.get("classification"), dict) else {}
            band_counts.update([str(classification.get("band") or "unclassified")])

        if category == "vocabulary":
            enrichment = {
                "withExamples": sum(has_examples(item, "exampleSentences") for item in category_items),
                "withCollocations": sum(bool(item.get("collocations")) for item in category_items),
                "withFrequency": sum("frequency" in item or "commonness" in item for item in category_items),
            }
        elif category == "kanji":
            enrichment = {
                "withUsefulWords": sum(bool(item.get("usefulWords")) for item in category_items),
                "withOnReadings": sum(bool(item.get("onyomi")) for item in category_items),
                "withKunReadings": sum(bool(item.get("kunyomi")) for item in category_items),
            }
        elif category == "grammar":
            enrichment = {
                "withExamples": sum(has_examples(item, "examples") for item in category_items),
                "withUsageConditions": sum(bool(item.get("usageConditions")) for item in category_items),
                "withContrasts": sum(bool(item.get("contrastIds")) for item in category_items),
            }
        elif category == "readings":
            enrichment = {"withQuestions": sum(bool(item.get("questions")) for item in category_items)}
        else:
            enrichment = {"withQuestions": sum(bool(item.get("questions")) for item in category_items), "withTranscript": sum(bool(item.get("transcript")) for item in category_items)}

        category_report[category] = {
            "total": len(category_items),
            "statuses": dict(statuses),
            "enrichment": enrichment,
            "gaps": gap_fields(len(category_items), enrichment),
            "withoutProvenance": sum(not string_list(item.get("sourceIds")) for item in category_items),
            "unknownProvenance": sum(any(source_id not in manifest_ids for source_id in string_list(item.get("sourceIds"))) for item in category_items),
            "unlinkedToLesson": sum(str(item.get("id")) not in lesson_item_ids for item in category_items if item.get("id")),
        }

    all_items = [item for category in CATEGORIES for item in items(package, category)]
    return {
        "packageStatus": package.get("status", "unknown"),
        "level": package.get("level") or course.get("jlptLevel"),
        "sources": len([source for source in package.get("sourceManifest", []) if isinstance(source, dict)]),
        "categories": category_report,
        "sourceCoverage": dict(source_counts.most_common()),
        "topics": dict(topic_counts.most_common()),
        "levels": dict(level_counts.most_common()),
        "bands": dict(band_counts.most_common()),
        "totals": {
            "items": len(all_items),
            "pending": sum((item.get("reviewStatus") or "approved") == "pending" for item in all_items),
            "approved": sum((item.get("reviewStatus") or "approved") == "approved" for item in all_items),
            "rejected": sum((item.get("reviewStatus") or "approved") == "rejected" for item in all_items),
            "unlinkedToLesson": sum(str(item.get("id")) not in lesson_item_ids for item in all_items if item.get("id")),
        },
    }


def print_report(value: dict[str, Any]) -> None:
    print(f"Kizashi Phase 1 staging · {value.get('level') or 'unknown level'} · {value['packageStatus']}")
    print(f"Sources: {value['sources']} · Items: {value['totals']['items']} · Pending: {value['totals']['pending']} · Approved: {value['totals']['approved']}")
    for category, details in value["categories"].items():
        statuses = ", ".join(f"{status} {count}" for status, count in details["statuses"].items()) or "none"
        enrichment = ", ".join(f"{key} {count}/{details['total']}" for key, count in details["enrichment"].items()) or "none"
        print(f"  {category}: {details['total']} ({statuses}) · {enrichment} · no provenance {details['withoutProvenance']} · unknown provenance {details['unknownProvenance']} · unlinked {details['unlinkedToLesson']}")
        if details["gaps"]:
            print("    gaps: " + ", ".join(details["gaps"]))
    if value["topics"]:
        print("Topics: " + ", ".join(f"{topic} {count}" for topic, count in value["topics"].items()))
    if value["levels"]:
        print("Levels: " + ", ".join(f"{level} {count}" for level, count in value["levels"].items()))
    if value["bands"]:
        print("Bands: " + ", ".join(f"{band} {count}" for band, count in value["bands"].items()))
    if value["sourceCoverage"]:
        print("Sources on records: " + ", ".join(f"{source} {count}" for source, count in value["sourceCoverage"].items()))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=Path("data/staging/kizashi-n5-source-review.json"))
    parser.add_argument("--json", action="store_true", help="Print machine-readable JSON instead of a summary.")
    args = parser.parse_args()
    value = report(read_package(args.input))
    if args.json:
        print(json.dumps(value, ensure_ascii=False, indent=2))
    else:
        print_report(value)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
