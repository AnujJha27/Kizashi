#!/usr/bin/env python3
"""Merge staged OpenJLPT records into an importable, review-only content package."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def read_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"Expected an object in {path}.")
    return value


def read_source_manifest(path: Path) -> list[dict[str, Any]]:
    value = read_json(path)
    sources = value.get("sources")
    if isinstance(sources, list):
        return [source for source in sources if isinstance(source, dict)]
    if isinstance(sources, dict):
        return [source for source in sources.values() if isinstance(source, dict)]
    return []


def text(value: Any) -> str:
    return value.strip() if isinstance(value, str) else ""


def list_value(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def strings(value: Any) -> list[str]:
    return [entry.strip() for entry in list_value(value) if isinstance(entry, str) and entry.strip()]


BASE_SOURCE = {
    "id": "michi-curated-n5-seed",
    "name": "Kizashi curated N5 seed",
    "type": "curriculum",
    "notes": "Original authored curriculum and examples.",
}


def unique(values: list[str]) -> list[str]:
    return list(dict.fromkeys(values))


def field_source_map(value: Any) -> dict[str, list[str]]:
    if not isinstance(value, dict):
        return {}
    return {field: strings(sources) for field, sources in value.items() if isinstance(field, str) and strings(sources)}


def merge_field_sources(target: dict[str, Any], incoming: dict[str, Any]) -> None:
    merged = field_source_map(target.get("fieldSourceIds"))
    for field, sources in field_source_map(incoming.get("fieldSourceIds")).items():
        merged[field] = unique([*merged.get(field, []), *sources])
    if merged:
        target["fieldSourceIds"] = merged


def merge_classification(target: dict[str, Any], incoming: dict[str, Any]) -> None:
    incoming_classification = incoming.get("classification")
    if not isinstance(incoming_classification, dict):
        return
    existing_classification = target.get("classification") if isinstance(target.get("classification"), dict) else {}
    target_level = text(target.get("jlptLevel"))
    incoming_level = text(incoming_classification.get("level"))
    level = text(existing_classification.get("level")) or target_level or incoming_level
    if level == "N5":
        band = text(existing_classification.get("band")) or (text(incoming_classification.get("band")) if incoming_level == level else "")
        band = band or ("core" if isinstance(target.get("difficulty"), int) and target["difficulty"] <= 2 else "extended")
    else:
        band = text(existing_classification.get("band")) or (text(incoming_classification.get("band")) if incoming_level == level else "") or "bridge"
    target["classification"] = {
        **incoming_classification,
        **existing_classification,
        "itemType": text(target.get("category")) or text(incoming_classification.get("itemType")),
        "itemId": text(target.get("id")) or text(incoming_classification.get("itemId")),
        "level": level or incoming_level,
        "band": band,
        "evidenceSources": unique([
            *strings(incoming_classification.get("evidenceSources")),
            *strings(existing_classification.get("evidenceSources")),
        ]),
    }


def semantic_key(item: dict[str, Any], category: str) -> tuple[str, ...]:
    if category == "vocabulary":
        return (category, text(item.get("writtenForm")).casefold(), text(item.get("reading")).casefold())
    if category == "kanji":
        return (category, text(item.get("character")))
    if category == "grammar":
        return (category, text(item.get("pattern")).casefold())
    return (category, text(item.get("id")))


def absorb_source(target: dict[str, Any], incoming: dict[str, Any], source_id: str) -> None:
    target["sourceIds"] = unique([*strings(target.get("sourceIds")), *strings(incoming.get("sourceIds")), source_id])
    record = incoming.get("sourceRecord")
    if isinstance(record, dict):
        records = target.get("sourceRecords") if isinstance(target.get("sourceRecords"), list) else []
        records.append({"sourceId": source_id, "record": record})
        target["sourceRecords"] = records
    merge_field_sources(target, incoming)
    merge_classification(target, incoming)
    for field in ("frequency", "frequencyMetadata", "dictionary"):
        if field in incoming and field not in target:
            target[field] = incoming[field]


def incoming_source_id(item: dict[str, Any]) -> str:
    return strings(item.get("sourceIds"))[0] if strings(item.get("sourceIds")) else "source-review"


def merge_category(module: dict[str, Any], category: str, incoming: list[dict[str, Any]]) -> list[dict[str, Any]]:
    existing = [item for item in list_value(module.get(category)) if isinstance(item, dict)]
    by_key = {semantic_key(item, category): item for item in existing}
    by_id = {text(item.get("id")): item for item in existing if text(item.get("id"))}
    reviewed: list[dict[str, Any]] = []
    added: list[dict[str, Any]] = []
    def queue(item: dict[str, Any]) -> None:
        if not any(candidate is item for candidate in reviewed):
            reviewed.append(item)

    for item in incoming:
        target = by_id.get(text(item.get("id"))) or by_key.get(semantic_key(item, category))
        if target is not None:
            absorb_source(target, item, incoming_source_id(item))
            target["tags"] = unique([*strings(target.get("tags")), "source-review"])
            target["reviewStatus"] = "pending"
            queue(target)
            continue
        key = semantic_key(item, category)
        target = next((candidate for candidate in added if semantic_key(candidate, category) == key), None)
        if target is not None:
            absorb_source(target, item, incoming_source_id(item))
            target["reviewStatus"] = "pending"
            queue(target)
            continue
        added.append(item)
        item["reviewStatus"] = "pending"
        by_id[text(item.get("id"))] = item
        by_key[key] = item
        queue(item)
    module[category] = [*existing, *added]
    return reviewed


def package_source_id(package: dict[str, Any]) -> str:
    for source in list_value(package.get("sources")):
        if isinstance(source, dict) and text(source.get("id")):
            return text(source.get("id"))
    return "source-review"


def base_fields(item: dict[str, Any], category: str, source_id: str) -> dict[str, Any]:
    source_ids = unique([source_id, *strings(item.get("sourceIds"))])
    tags = unique([*strings(item.get("tags")), "source-review"])
    return {
        **item,
        "category": category,
        "slug": text(item.get("slug") or item.get("id")),
        "subcategory": item.get("subcategory") or "source review",
        "difficulty": item.get("difficulty") if isinstance(item.get("difficulty"), int) else 2,
        "prerequisiteIds": strings(item.get("prerequisiteIds")),
        "tags": tags,
        "sourceIds": source_ids,
        "reviewStatus": "pending",
        "notes": item.get("notes") or f"Imported from {source_id} for review; do not publish without checking the source record.",
    }


def normalize_vocabulary(item: dict[str, Any], source_id: str) -> dict[str, Any]:
    dictionary = item.get("dictionary") if isinstance(item.get("dictionary"), dict) else {}
    dictionary_meanings = strings(dictionary.get("meanings"))
    dictionary_readings = strings(dictionary.get("readings"))
    dictionary_parts = strings(dictionary.get("partsOfSpeech"))
    dictionary_examples = list_value(dictionary.get("exampleSentences"))
    field_sources = field_source_map(item.get("fieldSourceIds"))
    for field in ("writtenForm", "reading", "meanings", "partOfSpeech", "exampleSentences", "collocations", "relatedWords", "antonyms", "classification"):
        field_sources.setdefault(field, [source_id])
    if dictionary:
        for field in ("reading", "meanings", "partOfSpeech"):
            field_sources[field] = unique([*field_sources.get(field, []), "jmdict"])
    if dictionary_examples:
        field_sources["exampleSentences"] = unique([*field_sources.get("exampleSentences", []), "jmdict-examples"])
    return {
        **base_fields(item, "vocabulary", source_id),
        "title": text(item.get("title") or item.get("writtenForm")),
        "writtenForm": text(item.get("writtenForm")),
        "reading": dictionary_readings[0] if dictionary_readings else text(item.get("reading")),
        "meanings": dictionary_meanings or strings(item.get("meanings")),
        "partOfSpeech": dictionary_parts[0] if dictionary_parts else item.get("partOfSpeech") or "source record",
        "exampleSentences": [*dictionary_examples, *list_value(item.get("exampleSentences"))][:3],
        "collocations": strings(item.get("collocations")),
        "relatedWords": strings(item.get("relatedWords")),
        "antonyms": strings(item.get("antonyms")),
        "fieldSourceIds": field_sources,
    }


def normalize_kanji(item: dict[str, Any], vocabulary: list[dict[str, Any]], source_id: str) -> dict[str, Any]:
    character = text(item.get("character"))
    dictionary = item.get("dictionary") if isinstance(item.get("dictionary"), dict) else {}
    useful_words = [
        {"word": word["writtenForm"], "reading": word["reading"], "meaning": word["meanings"][0]}
        for word in vocabulary
        if isinstance(word.get("writtenForm"), str)
        and character
        and character in word["writtenForm"]
        and isinstance(word.get("reading"), str)
        and word["reading"]
        and strings(word.get("meanings"))
    ][:3]
    field_sources = field_source_map(item.get("fieldSourceIds"))
    for field in ("character", "meanings", "onyomi", "kunyomi", "usefulWords", "classification"):
        field_sources.setdefault(field, [source_id])
    if dictionary:
        for field in ("meanings", "onyomi", "kunyomi"):
            field_sources[field] = unique([*field_sources.get(field, []), "kanjidic2"])
    return {
        **base_fields(item, "kanji", source_id),
        "title": character,
        "character": character,
        "meanings": strings(dictionary.get("meanings")) or strings(item.get("meanings")),
        "onyomi": strings(dictionary.get("onyomi")) or strings(item.get("onyomi")),
        "kunyomi": strings(dictionary.get("kunyomi")) or strings(item.get("kunyomi")),
        "usefulWords": list_value(item.get("usefulWords")) or useful_words,
        "fieldSourceIds": field_sources,
    }


def normalize_grammar(item: dict[str, Any], source_id: str) -> dict[str, Any]:
    pattern = text(item.get("pattern") or item.get("title"))
    meaning = text(item.get("meaning"))
    field_sources = field_source_map(item.get("fieldSourceIds"))
    for field in ("pattern", "meaning", "formation", "intuition", "usageConditions", "examples", "commonMistakes", "contrastIds", "practiceQuestionIds", "classification"):
        field_sources.setdefault(field, [source_id])
    return {
        **base_fields(item, "grammar", source_id),
        "title": pattern,
        "pattern": pattern,
        "meaning": meaning,
        "formation": text(item.get("formation")),
        "intuition": item.get("intuition") or meaning,
        "usageConditions": strings(item.get("usageConditions")),
        "examples": list_value(item.get("examples")),
        "commonMistakes": strings(item.get("commonMistakes")),
        "contrastIds": strings(item.get("contrastIds")),
        "practiceQuestionIds": strings(item.get("practiceQuestionIds")),
        "fieldSourceIds": field_sources,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", type=Path, default=Path("data/n5-foundations.json"))
    parser.add_argument("--staged", type=Path, default=Path("data/staging/openjlpt-n5.json"))
    parser.add_argument("--extra", action="append", type=Path, default=[], help="Additional staged source package; repeat for more sources.")
    parser.add_argument("--source-manifest", type=Path, help="Optional cache manifest whose artifacts should remain in package provenance.")
    parser.add_argument("--output", type=Path, default=Path("data/staging/kizashi-n5-source-review.json"))
    args = parser.parse_args()

    module = read_json(args.base)
    for category in ("vocabulary", "kanji", "grammar", "readings", "listening"):
        for item in list_value(module.get(category)):
            if isinstance(item, dict):
                item["sourceIds"] = unique([*strings(item.get("sourceIds")), BASE_SOURCE["id"]])
    staged_packages = [("openjlpt", read_json(args.staged))]
    for path in args.extra:
        package = read_json(path)
        staged_packages.append((package_source_id(package), package))
    vocabulary: list[dict[str, Any]] = []
    grammar: list[dict[str, Any]] = []
    raw_kanji: list[tuple[dict[str, Any], str]] = []
    source_manifest: list[dict[str, Any]] = [BASE_SOURCE]
    source_manifest.extend(entry for entry in list_value(module.get("sourceManifest")) if isinstance(entry, dict))
    if args.source_manifest and args.source_manifest.exists():
        source_manifest.extend(read_source_manifest(args.source_manifest))
    for source_id, staged in staged_packages:
        records = staged.get("records")
        if not isinstance(records, dict):
            raise ValueError(f"Staged package for {source_id} has no records object.")
        source_manifest.extend(entry for entry in list_value(staged.get("sources")) if isinstance(entry, dict))
        vocabulary.extend(normalize_vocabulary(item, source_id) for item in list_value(records.get("vocabulary")) if isinstance(item, dict))
        raw_kanji.extend((item, source_id) for item in list_value(records.get("kanji")) if isinstance(item, dict))
        grammar.extend(normalize_grammar(item, source_id) for item in list_value(records.get("grammar")) if isinstance(item, dict))
    available_vocabulary = [item for item in [*list_value(module.get("vocabulary")), *vocabulary] if isinstance(item, dict)]
    kanji = [normalize_kanji(item, available_vocabulary, source_id) for item, source_id in raw_kanji]

    vocabulary = merge_category(module, "vocabulary", vocabulary)
    kanji = merge_category(module, "kanji", kanji)
    grammar = merge_category(module, "grammar", grammar)
    imported = vocabulary + kanji + grammar

    course = module.get("course")
    if not isinstance(course, dict):
        raise ValueError("Base package has no course object.")
    chapters = [chapter for chapter in list_value(course.get("chapters")) if isinstance(chapter, dict) and chapter.get("id") != "chapter-openjlpt-review"]
    chapters.append({
        "id": "chapter-openjlpt-review",
        "slug": "openjlpt-review",
        "title": "Source review",
        "description": "Imported level classifications and dictionary-linked records awaiting human review.",
        "region": "quiet-city",
        "lessons": [{
            "id": "lesson-openjlpt-review",
            "slug": "openjlpt-review",
            "title": "Review imported records",
            "subtitle": "出典を確認する",
            "description": "Check meanings, examples, level fit, and lesson placement before publishing.",
            "estimatedMinutes": 20,
            "itemIds": [item["id"] for item in imported if item.get("id")],
        }],
    })
    course["chapters"] = chapters
    source_manifest_by_id = {text(entry.get("id")): entry for entry in source_manifest if text(entry.get("id"))}
    module["sourceManifest"] = list(source_manifest_by_id.values())
    module["status"] = "staged"
    module["level"] = module.get("level") or course.get("jlptLevel")
    module["sourcePolicy"] = "External records are imported for review only. Approve, enrich, and assign each record before publishing."
    module["stagingStats"] = {"vocabulary": len(vocabulary), "kanji": len(kanji), "grammar": len(grammar), "total": len(imported)}

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(module, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), "stats": module["stagingStats"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
