#!/usr/bin/env python3
"""Report Irodori grammar coverage against Kizashi's canonical grammar."""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


DEFAULT_CANONICAL = (
    Path("data/n5-foundations.json"),
    Path("data/n5-conversation-expansion.json"),
    Path("data/n5-practical-expansion.json"),
    Path("data/n5-life-expansion.json"),
    Path("data/n4-grammar-expansion.json"),
)


def read_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"Expected an object in {path}.")
    return value


def text(value: Any) -> str:
    return value.strip() if isinstance(value, str) else ""


def strings(value: Any) -> list[str]:
    return [entry.strip() for entry in value if isinstance(entry, str) and entry.strip()] if isinstance(value, list) else []


def normalize_pattern(value: Any) -> str:
    pattern = unicodedata.normalize("NFKC", text(value)).casefold()
    pattern = re.sub(r"[\s【】「」『』()（）\[\]{}]", "", pattern)
    pattern = re.sub(r"(?:バショ|ワタシ|キ|ダイカ|ダイ|カナ)", "", pattern)
    return pattern


def has_translated_examples(item: dict[str, Any], minimum: int = 1) -> bool:
    examples = item.get("examples")
    if not isinstance(examples, list):
        return False
    return sum(bool(text(example.get("japanese")) and text(example.get("translation"))) for example in examples if isinstance(example, dict)) >= minimum


def canonical_grammar(paths: list[Path]) -> list[dict[str, Any]]:
    result = []
    for path in paths:
        package = read_json(path)
        result.extend(item for item in package.get("grammar", []) if isinstance(item, dict))
    return result


def audit(source: dict[str, Any], canonical: list[dict[str, Any]], mapping: dict[str, Any] | None = None) -> dict[str, Any]:
    records = [item for item in source.get("records", {}).get("grammar", []) if isinstance(item, dict)]
    canonical_by_pattern = {normalize_pattern(item.get("pattern")): item for item in canonical if normalize_pattern(item.get("pattern"))}
    mapped_by_record: dict[str, list[str]] = defaultdict(list)
    for canonical_id, references in (mapping or {}).items():
        if not isinstance(references, list):
            continue
        for reference in references:
            if isinstance(reference, dict) and text(reference.get("sourceRecordId")):
                mapped_by_record[text(reference["sourceRecordId"])].append(canonical_id)
    matches: dict[str, list[str]] = {}
    duplicate_groups: defaultdict[str, list[str]] = defaultdict(list)
    for item in records:
        pattern = normalize_pattern(item.get("pattern"))
        if pattern:
            duplicate_groups[pattern].append(text(item.get("id")))
        mapped = mapped_by_record.get(text(item.get("id")))
        match = canonical_by_pattern.get(pattern)
        if mapped:
            matches[text(item.get("id"))] = sorted(set(mapped))
        elif match:
            matches[text(item.get("id"))] = [text(match.get("id"))]

    completeness = {
        "hasMeaning": sum(bool(text(item.get("meaning"))) for item in records),
        "hasFormation": sum(bool(text(item.get("formation"))) for item in records),
        "hasIntuition": sum(bool(text(item.get("intuition"))) for item in records),
        "hasUsageConditions": sum(bool(strings(item.get("usageConditions"))) for item in records),
        "hasAtLeast2Examples": sum(has_translated_examples(item, 2) for item in records),
        "hasAtLeast4Examples": sum(has_translated_examples(item, 4) for item in records),
        "hasCommonMistakes": sum(bool(strings(item.get("commonMistakes"))) for item in records),
        "hasContrasts": sum(bool(strings(item.get("contrastIds"))) for item in records),
        "hasPractice": sum(bool(strings(item.get("practiceQuestionIds"))) for item in records),
        "hasAssessmentContext": 0,
    }
    def complete(item: dict[str, Any]) -> bool:
        return bool(text(item.get("meaning")) and text(item.get("formation")) and text(item.get("intuition")) and strings(item.get("usageConditions")) and has_translated_examples(item, 2) and strings(item.get("commonMistakes")) and strings(item.get("practiceQuestionIds")))

    def partial(item: dict[str, Any]) -> bool:
        return bool(text(item.get("meaning")) or text(item.get("formation")) or text(item.get("intuition")) or strings(item.get("usageConditions")) or item.get("examples") or strings(item.get("commonMistakes")) or strings(item.get("practiceQuestionIds")))
    statuses = Counter(text(item.get("reviewStatus")) or "approved" for item in records)
    by_course = Counter(text(item.get("sourceCourse")) or "unclassified" for item in records)
    by_level = Counter(text(item.get("sourceLevel")) or "unclassified" for item in records)
    by_source = Counter(source.get("sources", [{}])[0].get("id", "irodori-sentence-patterns") for _ in records)
    relevance = Counter({
        "N5-relevant": sum(by_level[level] for level in ("Starter", "Elementary 1")),
        "N4-relevant": sum(by_level[level] for level in ("Elementary 2", "Pre-Intermediate")),
        "above-target": sum(by_level[level] for level in ("Intermediate 1", "Intermediate 2")),
        "unclassified": by_level["unclassified"],
    })
    duplicate_sets = {pattern: ids for pattern, ids in duplicate_groups.items() if len(ids) > 1}
    mapped_ids = {item_id for values in matches.values() for item_id in values}
    return {
        "sourceRecords": len(records),
        "bySource": dict(by_source),
        "bySourceCourse": dict(by_course),
        "bySourceLevel": dict(by_level),
        "canonicalMatches": len(matches),
        "canonicalConcepts": len(mapped_ids),
        "unmappedRecords": len(records) - len(matches),
        "duplicateAliasSets": len(duplicate_sets),
        "potentialDuplicateSets": duplicate_sets,
        "relevance": dict(relevance),
        "statuses": dict(statuses),
        "completeness": completeness,
        "fullLearningUnits": sum(complete(item) for item in records),
        "partialLearningUnits": sum(partial(item) and not complete(item) for item in records),
        "sourceOnlyRecords": len(records) - len(matches),
    }


def print_report(result: dict[str, Any]) -> None:
    print("Irodori grammar audit")
    print(f"Source records: {result['sourceRecords']} · Canonical matches: {result['canonicalMatches']} · Unmapped: {result['unmappedRecords']}")
    print(f"Canonical concepts: {result['canonicalConcepts']} · Duplicate alias sets: {result['duplicateAliasSets']}")
    print("By course: " + ", ".join(f"{key} {value}" for key, value in result["bySourceCourse"].items()))
    print("By source level: " + ", ".join(f"{key} {value}" for key, value in result["bySourceLevel"].items()))
    print("Relevance: " + ", ".join(f"{key} {value}" for key, value in result["relevance"].items()))
    print("Status: " + ", ".join(f"{key} {value}" for key, value in result["statuses"].items()))
    print(f"Learning units: full {result['fullLearningUnits']} · partial {result['partialLearningUnits']} · source-only {result['sourceOnlyRecords']}")
    print("Completeness: " + ", ".join(f"{key} {value}/{result['sourceRecords']}" for key, value in result["completeness"].items()))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=Path("data/staging/irodori-grammar.json"))
    parser.add_argument("--canonical", type=Path, action="append", default=list(DEFAULT_CANONICAL))
    parser.add_argument("--mapping", type=Path, default=Path("data/source-maps/irodori-grammar.json"))
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    mapping = read_json(args.mapping) if args.mapping.is_file() else None
    result = audit(read_json(args.input), canonical_grammar(args.canonical), mapping)
    print(json.dumps(result, ensure_ascii=False, indent=2) if args.json else "")
    if not args.json:
        print_report(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
