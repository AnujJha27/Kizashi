#!/usr/bin/env python3
"""Fail-safe QA for staged Kizashi content before a publish export."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


CATEGORIES = ("vocabulary", "kanji", "grammar", "readings", "listening")
REQUIRED = {
    "vocabulary": ("writtenForm", "reading", "meanings", "partOfSpeech", "exampleSentences", "collocations"),
    "kanji": ("character", "meanings", "usefulWords"),
    "grammar": ("pattern", "meaning", "formation", "intuition", "usageConditions", "examples", "commonMistakes"),
    "readings": ("title", "passage", "translation", "questions"),
    "listening": ("title", "situation", "transcript", "questions", "sourceType"),
}


def text(value: Any) -> str:
    return value.strip() if isinstance(value, str) else ""


def strings(value: Any) -> list[str]:
    return [entry.strip() for entry in value if isinstance(entry, str) and entry.strip()] if isinstance(value, list) else []


def field_source_ids(item: dict[str, Any]) -> list[str]:
    value = item.get("fieldSourceIds")
    if not isinstance(value, dict):
        return []
    return [source_id for sources in value.values() for source_id in strings(sources)]


def has_value(value: Any) -> bool:
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, list):
        return bool(value)
    return value is not None


def package_items(package: dict[str, Any], category: str) -> list[dict[str, Any]]:
    return [item for item in package.get(category, []) if isinstance(item, dict)]


def real_lesson_item_ids(package: dict[str, Any]) -> set[str]:
    course = package.get("course") if isinstance(package.get("course"), dict) else {}
    result: set[str] = set()
    for chapter in course.get("chapters", []):
        if not isinstance(chapter, dict) or chapter.get("id") == "chapter-openjlpt-review":
            continue
        for lesson in chapter.get("lessons", []):
            if isinstance(lesson, dict):
                result.update(strings(lesson.get("itemIds")))
    return result


def report(package: dict[str, Any]) -> dict[str, Any]:
    source_ids = {text(source.get("id")) for source in package.get("sourceManifest", []) if isinstance(source, dict) and text(source.get("id"))}
    sources_by_id = {text(source.get("id")): source for source in package.get("sourceManifest", []) if isinstance(source, dict) and text(source.get("id"))}
    assignments = {
        text(item_id)
        for chapter in (package.get("course") or {}).get("chapters", [])
        if isinstance(chapter, dict)
        for lesson in chapter.get("lessons", [])
        if isinstance(lesson, dict)
        for item_id in strings(lesson.get("itemIds"))
    }
    real_assignments = assignments.intersection(real_lesson_item_ids(package))
    blockers: list[str] = []
    source_review_count = 0
    approved_source_review_count = 0
    totals: dict[str, int] = {}
    for category in CATEGORIES:
        entries = package_items(package, category)
        totals[category] = len(entries)
        for item in entries:
            item_id = text(item.get("id")) or f"{category} item"
            status = text(item.get("reviewStatus")) or "approved"
            source_review = "source-review" in strings(item.get("tags"))
            if source_review:
                source_review_count += 1
                if status == "approved":
                    approved_source_review_count += 1
            if status not in {"pending", "approved", "rejected"}:
                blockers.append(f"{item_id}: unknown review status {status}")
            if status != "approved":
                continue
            missing = [field for field in REQUIRED[category] if not has_value(item.get(field))]
            if missing:
                blockers.append(f"{item_id}: missing {', '.join(missing)}")
            if not strings(item.get("sourceIds")):
                blockers.append(f"{item_id}: missing sourceIds")
            if any(source_id not in source_ids for source_id in strings(item.get("sourceIds"))):
                blockers.append(f"{item_id}: sourceIds are absent from sourceManifest")
            if "source-review" in strings(item.get("tags")):
                for source_id in [*strings(item.get("sourceIds")), *field_source_ids(item)]:
                    source = sources_by_id.get(source_id)
                    if source and text(source.get("type")) != "user" and not source_id.startswith("michi-") and not text(source.get("license")):
                        blockers.append(f"{item_id}: source {source_id} has no recorded license terms")
            if "source-review" in strings(item.get("tags")) and item_id not in real_assignments:
                blockers.append(f"{item_id}: approved source-review item is not assigned to a real Journey lesson")
            classification = item.get("classification") if isinstance(item.get("classification"), dict) else {}
            if "source-review" in strings(item.get("tags")) and category in {"vocabulary", "kanji", "grammar"} and not text(classification.get("band")):
                blockers.append(f"{item_id}: missing reviewed curriculum classification")
            if classification.get("conflict") is True:
                blockers.append(f"{item_id}: curriculum classification has conflicting source levels")
    if source_review_count and not approved_source_review_count:
        blockers.append("No approved source-review items found; set reviewStatus to approved after checking each record.")
    return {"totals": totals, "blockers": blockers, "status": "blocked" if blockers else "ready"}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--package", type=Path, required=True)
    parser.add_argument("--strict", action="store_true", help="Exit non-zero when any publish blocker exists.")
    args = parser.parse_args()
    package = json.loads(args.package.read_text(encoding="utf-8"))
    if not isinstance(package, dict):
        raise ValueError("Expected a package object.")
    value = report(package)
    print(json.dumps(value, ensure_ascii=False, indent=2))
    if args.strict and value["blockers"]:
        raise SystemExit(f"Content QA found {len(value['blockers'])} review blockers.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
