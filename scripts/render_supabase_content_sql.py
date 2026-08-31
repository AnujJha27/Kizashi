#!/usr/bin/env python3
"""Render reviewed staged content as idempotent Supabase SQL."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


CATEGORIES = ("vocabulary", "kanji", "grammar", "readings", "listening")
ITEM_TYPES = {"readings": "reading", "listening": "listening"}


def read_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"Expected an object in {path}.")
    return value


def text(value: Any) -> str:
    return value.strip() if isinstance(value, str) else ""


def strings(value: Any) -> list[str]:
    return [entry.strip() for entry in value if isinstance(entry, str) and entry.strip()] if isinstance(value, list) else []


def dicts(value: Any) -> list[dict[str, Any]]:
    return [entry for entry in value if isinstance(entry, dict)] if isinstance(value, list) else []


def field_source_ids(item: dict[str, Any]) -> list[str]:
    values = item.get("fieldSourceIds")
    if not isinstance(values, dict):
        return []
    return [source_id for sources in values.values() for source_id in strings(sources)]


def sql_text(value: Any) -> str:
    return "'" + text(value).replace("'", "''") + "'"


def sql_nullable_text(value: Any) -> str:
    value = text(value)
    return "null" if not value else sql_text(value)


def sql_int(value: Any) -> str:
    return str(value) if isinstance(value, int) and not isinstance(value, bool) else "null"


def sql_number(value: Any, fallback: float | None = None) -> str:
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return str(value)
    return "null" if fallback is None else str(fallback)


def sql_array(value: Any) -> str:
    return "array[" + ", ".join(sql_text(entry) for entry in strings(value)) + "]::text[]"


def sql_json(value: Any) -> str:
    return sql_text(json.dumps(value if isinstance(value, list) else [], ensure_ascii=False, separators=(",", ":"))) + "::jsonb"


def sql_json_object(value: Any) -> str:
    return sql_text(json.dumps(value if isinstance(value, dict) else {}, ensure_ascii=False, separators=(",", ":"))) + "::jsonb"


def required_text(item: dict[str, Any], category: str, field: str) -> None:
    if not text(item.get(field)):
        raise ValueError(f"{category} item {text(item.get('id')) or '<unknown>'} is missing {field}.")


def required_strings(item: dict[str, Any], category: str, field: str, minimum: int = 1) -> None:
    values = item.get(field)
    if not isinstance(values, list) or len([value for value in values if text(value)]) < minimum:
        raise ValueError(f"{category} item {text(item.get('id')) or '<unknown>'} needs at least {minimum} {field}.")


def required_examples(item: dict[str, Any], category: str, field: str, minimum: int = 1) -> None:
    values = item.get(field)
    valid = [value for value in values if isinstance(value, dict) and text(value.get("japanese")) and text(value.get("translation"))] if isinstance(values, list) else []
    if len(valid) < minimum:
        raise ValueError(f"{category} item {text(item.get('id')) or '<unknown>'} needs at least {minimum} complete {field}.")


def validate_question(question: dict[str, Any], item_categories: dict[str, str]) -> None:
    question_id = text(question.get("id")) or "<unknown>"
    item_id = text(question.get("itemId"))
    if not item_id or item_id not in item_categories:
        raise ValueError(f"Question {question_id} targets an unknown learning item.")
    if text(question.get("category")) != item_categories[item_id]:
        raise ValueError(f"Question {question_id} category must match {item_categories[item_id]}.")
    if text(question.get("validationStatus")) != "validated":
        raise ValueError(f"Question {question_id} is not approved; only validated questions can be exported.")
    if not text(question.get("questionType")) or not text(question.get("prompt")) or not text(question.get("explanation")):
        raise ValueError(f"Question {question_id} needs a question type, prompt, and explanation.")
    answer_mode = text(question.get("answerMode")) or "choice"
    if answer_mode not in ("choice", "text"):
        raise ValueError(f"Question {question_id} has an unknown answer mode: {answer_mode}.")
    if answer_mode == "text":
        answers = strings(question.get("acceptedAnswers"))
        if not answers or len({answer.casefold() for answer in answers}) != len(answers):
            raise ValueError(f"Question {question_id} needs unique accepted answers.")
    else:
        options = strings(question.get("options"))
        correct_index = question.get("correctIndex")
        normalized = [" ".join(option.split()).casefold() for option in options]
        if len(options) < 2 or len(set(normalized)) != len(normalized) or not isinstance(correct_index, int) or isinstance(correct_index, bool) or not 0 <= correct_index < len(options):
            raise ValueError(f"Question {question_id} needs unique options and a valid correctIndex.")
    if text(question.get("questionType")) == "sentence ordering":
        tokens = strings(question.get("tokens"))
        order = question.get("correctOrder")
        if not isinstance(order, list) or len(tokens) < 2 or len(order) != len(tokens) or any(not isinstance(entry, int) or isinstance(entry, bool) for entry in order) or set(order) != set(range(len(tokens))):
            raise ValueError(f"Question {question_id} needs a complete sentence ordering.")


def validate_export_item(item: dict[str, Any], category: str) -> None:
    for field in ("id", "slug", "title"):
        required_text(item, category, field)
    required_strings(item, category, "tags")
    required_strings(item, category, "sourceIds")
    if "source-review" in strings(item.get("tags")):
        classification = item.get("classification")
        if not isinstance(classification, dict):
            raise ValueError(f"{category} item {text(item.get('id')) or '<unknown>'} needs a reviewed classification before export.")
        for field in ("level", "band", "confidence", "inclusionReason", "reviewedAt"):
            if not text(classification.get(field)):
                raise ValueError(f"{category} item {text(item.get('id')) or '<unknown>'} classification is missing {field}.")
        if text(classification.get("level")) not in ("N5", "N4", "N3", "N2", "N1"):
            raise ValueError(f"{category} item {text(item.get('id')) or '<unknown>'} has an invalid classification level.")
        if text(classification.get("band")) not in ("core", "extended", "bridge"):
            raise ValueError(f"{category} item {text(item.get('id')) or '<unknown>'} has an invalid classification band.")
        if text(classification.get("confidence")) not in ("high", "medium", "low"):
            raise ValueError(f"{category} item {text(item.get('id')) or '<unknown>'} has an invalid classification confidence.")
        if not strings(classification.get("evidenceSources")):
            raise ValueError(f"{category} item {text(item.get('id')) or '<unknown>'} classification needs evidenceSources.")
        if classification.get("conflict") is True:
            raise ValueError(f"{category} item {text(item.get('id')) or '<unknown>'} has conflicting source levels; resolve them before export.")
    if category == "vocabulary":
        for field in ("writtenForm", "reading", "partOfSpeech"):
            required_text(item, category, field)
        for field in ("frequency", "spokenFrequency"):
            if field in item and item[field] is not None and (not isinstance(item[field], int) or isinstance(item[field], bool) or item[field] < 0):
                raise ValueError(f"vocabulary item {text(item.get('id')) or '<unknown>'} needs a non-negative integer {field}.")
        required_strings(item, category, "meanings")
        required_examples(item, category, "exampleSentences")
    elif category == "kanji":
        required_text(item, category, "character")
        required_strings(item, category, "meanings")
        useful_words = item.get("usefulWords")
        if not isinstance(useful_words, list) or not useful_words:
            raise ValueError(f"kanji item {text(item.get('id')) or '<unknown>'} needs usefulWords.")
        for index, word in enumerate(useful_words):
            if not isinstance(word, dict) or not all(text(word.get(field)) for field in ("word", "reading", "meaning")):
                raise ValueError(f"kanji item {text(item.get('id')) or '<unknown>'} has an incomplete usefulWords[{index}].")
    elif category == "grammar":
        for field in ("pattern", "meaning", "formation", "intuition"):
            required_text(item, category, field)
        required_strings(item, category, "usageConditions")
        required_examples(item, category, "examples", 2)
        required_strings(item, category, "commonMistakes")
    elif category == "reading":
        for field in ("passage", "translation"):
            required_text(item, category, field)
    elif category == "listening":
        for field in ("situation", "voice", "transcript", "sourceType"):
            required_text(item, category, field)
        if not isinstance(item.get("speed"), (int, float)) or isinstance(item.get("speed"), bool) or item["speed"] <= 0:
            raise ValueError(f"listening item {text(item.get('id')) or '<unknown>'} needs a positive speed.")
        questions = item.get("questions")
        if not isinstance(questions, list) or not questions:
            raise ValueError(f"listening item {text(item.get('id')) or '<unknown>'} needs questions.")


def question_sql(question: dict[str, Any], item_categories: dict[str, str]) -> str:
    question_id = text(question.get("id"))
    item_id = text(question.get("itemId"))
    if not question_id or not item_id:
        raise ValueError("An approved question is missing id or itemId.")
    validate_question(question, item_categories)
    category = text(question.get("category"))
    if text(question.get("generatedBy")).startswith("openrouter:"):
        review = question.get("review")
        if not isinstance(review, dict) or text(review.get("status")) != "approved" or not text(review.get("reviewedBy")) or not text(review.get("reviewedAt")):
            raise ValueError(f"Question {question_id} needs human approval before export.")
    answer_mode = text(question.get("answerMode")) or "choice"
    values = [
        sql_text(question_id), sql_text(item_id), sql_text(category), sql_text(question.get("questionType")),
        sql_nullable_text(question.get("jlptLevel")), sql_text(question.get("prompt")), sql_json(question.get("options")),
        sql_int(question.get("correctIndex") if isinstance(question.get("correctIndex"), int) else 0), sql_text(question.get("explanation")),
        sql_nullable_text(question.get("audioUrl")), sql_nullable_text(question.get("audioText")), sql_json_object(question.get("audio")), sql_text("validated"),
        sql_nullable_text(question.get("generatedBy")), sql_json_object(question.get("review")), sql_text(answer_mode), sql_json(question.get("acceptedAnswers")),
        sql_json(question.get("tokens")), sql_json(question.get("correctOrder")),
    ]
    return "insert into public.practice_questions (id, item_id, category, question_type, jlpt_level, prompt, options, correct_index, explanation, audio_url, audio_text, audio_metadata, validation_status, generated_by, review_metadata, answer_mode, accepted_answers, tokens, correct_order) values (" + ", ".join(values) + ") on conflict (id) do update set item_id = excluded.item_id, category = excluded.category, question_type = excluded.question_type, jlpt_level = excluded.jlpt_level, prompt = excluded.prompt, options = excluded.options, correct_index = excluded.correct_index, explanation = excluded.explanation, audio_url = excluded.audio_url, audio_text = excluded.audio_text, audio_metadata = excluded.audio_metadata, validation_status = excluded.validation_status, generated_by = excluded.generated_by, review_metadata = excluded.review_metadata, answer_mode = excluded.answer_mode, accepted_answers = excluded.accepted_answers, tokens = excluded.tokens, correct_order = excluded.correct_order;"


def source_sql(source: dict[str, Any]) -> str:
    source_id = text(source.get("id"))
    if not source_id:
        raise ValueError("A source record is missing id.")
    return "insert into public.content_sources (id, name, source_type, url, license, retrieved_at, notes, sha256, local_filename) values (" + ", ".join([
        sql_text(source_id),
        sql_text(source.get("name")),
        sql_text(source.get("type") or "curriculum"),
        sql_nullable_text(source.get("url")),
        sql_nullable_text(source.get("license")),
        sql_nullable_text(source.get("retrievedAt")),
        sql_nullable_text(source.get("notes")),
        sql_nullable_text(source.get("sha256")),
        sql_nullable_text(source.get("localFilename")),
    ]) + ") on conflict (id) do update set name = excluded.name, source_type = excluded.source_type, url = excluded.url, license = excluded.license, retrieved_at = excluded.retrieved_at, notes = excluded.notes, sha256 = excluded.sha256, local_filename = excluded.local_filename;"


def item_sql(item: dict[str, Any], category: str) -> list[str]:
    item_id = text(item.get("id"))
    if not item_id:
        raise ValueError(f"A {category} item is missing id.")
    review_status = text(item.get("reviewStatus")) or "approved"
    if review_status != "approved":
        raise ValueError(f"Item {item_id} is not approved; only approved records can be exported.")
    validate_export_item(item, category)
    item_type = ITEM_TYPES.get(category, category)
    learning = "insert into public.learning_items (id, slug, item_type, jlpt_level, subcategory, difficulty, prerequisite_ids, tags, review_status, field_source_ids, audio_metadata) values (" + ", ".join([
        sql_text(item_id),
        sql_text(item.get("slug") or item_id),
        sql_text(item_type),
        sql_nullable_text(item.get("jlptLevel")),
        sql_nullable_text(item.get("subcategory")),
        sql_int(item.get("difficulty") if isinstance(item.get("difficulty"), int) else 2),
        sql_array(item.get("prerequisiteIds")),
        sql_array(item.get("tags")),
        sql_text(review_status),
        sql_json_object(item.get("fieldSourceIds")),
        sql_json_object(item.get("audio")),
    ]) + ") on conflict (id) do update set slug = excluded.slug, jlpt_level = excluded.jlpt_level, subcategory = excluded.subcategory, difficulty = excluded.difficulty, prerequisite_ids = excluded.prerequisite_ids, tags = excluded.tags, review_status = excluded.review_status, field_source_ids = excluded.field_source_ids, audio_metadata = excluded.audio_metadata;"
    specialized = {
        "vocabulary": "insert into public.vocabulary (item_id, written_form, reading, meanings, part_of_speech, commonness, frequency, frequency_metadata, spoken_frequency, spoken_frequency_metadata, example_sentences, collocations, related_words, antonyms, notes, audio_url) values (" + ", ".join([
            sql_text(item_id), sql_text(item.get("writtenForm")), sql_text(item.get("reading")), sql_array(item.get("meanings")), sql_text(item.get("partOfSpeech") or "source record"), sql_int(item.get("commonness")), sql_int(item.get("frequency")), sql_json_object(item.get("frequencyMetadata")), sql_int(item.get("spokenFrequency")), sql_json_object(item.get("spokenFrequencyMetadata")), sql_json(item.get("exampleSentences")), sql_array(item.get("collocations")), sql_array(item.get("relatedWords")), sql_array(item.get("antonyms")), sql_nullable_text(item.get("notes")), sql_nullable_text(item.get("audioUrl")),
        ]) + ") on conflict (item_id) do update set written_form = excluded.written_form, reading = excluded.reading, meanings = excluded.meanings, part_of_speech = excluded.part_of_speech, commonness = excluded.commonness, frequency = excluded.frequency, frequency_metadata = excluded.frequency_metadata, spoken_frequency = excluded.spoken_frequency, spoken_frequency_metadata = excluded.spoken_frequency_metadata, example_sentences = excluded.example_sentences, collocations = excluded.collocations, related_words = excluded.related_words, antonyms = excluded.antonyms, notes = excluded.notes, audio_url = excluded.audio_url;",
        "kanji": "insert into public.kanji (item_id, character, meanings, onyomi, kunyomi, stroke_count, grade, radical, nanori, components, mnemonic, stroke_order, useful_words) values (" + ", ".join([
            sql_text(item_id), sql_text(item.get("character")), sql_array(item.get("meanings")), sql_array(item.get("onyomi")), sql_array(item.get("kunyomi")), sql_int(item.get("strokeCount")), sql_int(item.get("grade")), sql_nullable_text(item.get("radical")), sql_array(item.get("nanori")), sql_array(item.get("components")), sql_nullable_text(item.get("mnemonic")), sql_nullable_text(item.get("strokeOrder")), sql_json(item.get("usefulWords")),
        ]) + ") on conflict (item_id) do update set character = excluded.character, meanings = excluded.meanings, onyomi = excluded.onyomi, kunyomi = excluded.kunyomi, stroke_count = excluded.stroke_count, grade = excluded.grade, radical = excluded.radical, nanori = excluded.nanori, components = excluded.components, mnemonic = excluded.mnemonic, stroke_order = excluded.stroke_order, useful_words = excluded.useful_words;",
        "grammar": "insert into public.grammar_points (item_id, pattern, meaning, formation, intuition, usage_conditions, examples, common_mistakes, contrast_ids, practice_question_ids) values (" + ", ".join([
            sql_text(item_id), sql_text(item.get("pattern")), sql_text(item.get("meaning")), sql_text(item.get("formation")), sql_text(item.get("intuition")), sql_array(item.get("usageConditions")), sql_json(item.get("examples")), sql_array(item.get("commonMistakes")), sql_array(item.get("contrastIds")), sql_array(item.get("practiceQuestionIds")),
        ]) + ") on conflict (item_id) do update set pattern = excluded.pattern, meaning = excluded.meaning, formation = excluded.formation, intuition = excluded.intuition, usage_conditions = excluded.usage_conditions, examples = excluded.examples, common_mistakes = excluded.common_mistakes, contrast_ids = excluded.contrast_ids, practice_question_ids = excluded.practice_question_ids;",
        "reading": "insert into public.readings (item_id, title, passage, translation, vocabulary_ids, grammar_ids, kanji_ids, estimated_difficulty) values (" + ", ".join([
            sql_text(item_id), sql_text(item.get("title")), sql_text(item.get("passage")), sql_text(item.get("translation")), sql_array(item.get("vocabularyIds")), sql_array(item.get("grammarIds")), sql_array(item.get("kanjiIds")), sql_int(item.get("estimatedDifficulty") if isinstance(item.get("estimatedDifficulty"), int) else 1),
        ]) + ") on conflict (item_id) do update set title = excluded.title, passage = excluded.passage, translation = excluded.translation, vocabulary_ids = excluded.vocabulary_ids, grammar_ids = excluded.grammar_ids, kanji_ids = excluded.kanji_ids, estimated_difficulty = excluded.estimated_difficulty;",
        "listening": "insert into public.listening_exercises (item_id, title, situation, audio_url, voice, speed, source_type, transcript, questions) values (" + ", ".join([
            sql_text(item_id), sql_text(item.get("title")), sql_text(item.get("situation")), sql_nullable_text(item.get("audioUrl")), sql_nullable_text(item.get("voice")), sql_number(item.get("speed"), 1), sql_text(item.get("sourceType") or "tts"), sql_nullable_text(item.get("transcript")), sql_json(item.get("questions")),
        ]) + ") on conflict (item_id) do update set title = excluded.title, situation = excluded.situation, audio_url = excluded.audio_url, voice = excluded.voice, speed = excluded.speed, source_type = excluded.source_type, transcript = excluded.transcript, questions = excluded.questions;",
    }
    return [learning, specialized[category]] if category in specialized else [learning]


def course_sql(course: dict[str, Any]) -> str:
    return "insert into public.courses (id, slug, title, description, jlpt_level, sort_order) values (" + ", ".join([sql_text(course.get("id")), sql_text(course.get("slug")), sql_text(course.get("title")), sql_nullable_text(course.get("description")), sql_nullable_text(course.get("jlptLevel")), "0"]) + ") on conflict (id) do update set slug = excluded.slug, title = excluded.title, description = excluded.description, jlpt_level = excluded.jlpt_level;"


def chapter_sql(course: dict[str, Any], chapter: dict[str, Any], sort_order: int) -> str:
    return "insert into public.chapters (id, course_id, slug, title, description, region, sort_order) values (" + ", ".join([sql_text(chapter.get("id")), sql_text(course.get("id")), sql_text(chapter.get("slug")), sql_text(chapter.get("title")), sql_nullable_text(chapter.get("description")), sql_text(chapter.get("region") or "quiet-city"), str(sort_order)]) + ") on conflict (id) do update set course_id = excluded.course_id, slug = excluded.slug, title = excluded.title, description = excluded.description, region = excluded.region, sort_order = excluded.sort_order;"


def lesson_sql(chapter: dict[str, Any], lesson: dict[str, Any], sort_order: int) -> str:
    return "insert into public.lessons (id, chapter_id, slug, title, subtitle, description, estimated_minutes, sort_order) values (" + ", ".join([sql_text(lesson.get("id")), sql_text(chapter.get("id")), sql_text(lesson.get("slug")), sql_text(lesson.get("title")), sql_text(lesson.get("subtitle")), sql_nullable_text(lesson.get("description")), sql_int(lesson.get("estimatedMinutes") if isinstance(lesson.get("estimatedMinutes"), int) else 20), str(sort_order)]) + ") on conflict (id) do update set chapter_id = excluded.chapter_id, slug = excluded.slug, title = excluded.title, subtitle = excluded.subtitle, description = excluded.description, estimated_minutes = excluded.estimated_minutes, sort_order = excluded.sort_order;"


def link_sql(item: dict[str, Any], lesson_id: str, sort_order: int) -> list[str]:
    item_id = sql_text(item["id"])
    item_type = ITEM_TYPES.get(text(item.get("category")), text(item.get("category")))
    statements = [f"insert into public.lesson_learning_items (lesson_id, item_id, sort_order) values ({sql_text(lesson_id)}, {item_id}, {sort_order}) on conflict do nothing;"]
    join_table = {"vocabulary": "lesson_vocabulary", "kanji": "lesson_kanji", "grammar": "lesson_grammar", "reading": "lesson_readings", "listening": "lesson_listening"}.get(item_type)
    if join_table:
        statements.append(f"insert into public.{join_table} (lesson_id, item_id) values ({sql_text(lesson_id)}, {item_id}) on conflict do nothing;")
    return statements


def classification_sql(item: dict[str, Any]) -> str | None:
    classification = item.get("classification") if isinstance(item.get("classification"), dict) else {}
    level = text(classification.get("level") or item.get("jlptLevel"))
    band = text(classification.get("band")) or "extended"
    confidence = text(classification.get("confidence")) or "medium"
    if not level:
        return None
    evidence = strings(classification.get("evidenceSources")) or strings(item.get("sourceIds"))
    reason = text(classification.get("inclusionReason")) or "Imported for review from a licensed or open source."
    reviewed_at = text(classification.get("reviewedAt")) or "current_date"
    reviewed_sql = "current_date" if reviewed_at == "current_date" else sql_text(reviewed_at)
    return "insert into public.curriculum_classifications (item_type, item_id, level, band, confidence, evidence_sources, inclusion_reason, reviewed_at) values (" + ", ".join([sql_text(item.get("category")), sql_text(item.get("id")), sql_text(level), sql_text(band), sql_text(confidence), sql_array(evidence), sql_text(reason), reviewed_sql]) + ") on conflict (item_type, item_id) do update set level = excluded.level, band = excluded.band, confidence = excluded.confidence, evidence_sources = excluded.evidence_sources, inclusion_reason = excluded.inclusion_reason, reviewed_at = excluded.reviewed_at;"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--package", type=Path, default=Path("data/staging/kizashi-n5-source-review.json"))
    parser.add_argument("--output", type=Path, default=Path("supabase/generated/kizashi-content.sql"))
    parser.add_argument("--questions", type=Path, help="Optional JSON array of approved question drafts to include.")
    parser.add_argument("--approved", action="store_true", help="Confirm the package was reviewed and is ready for SQL generation.")
    args = parser.parse_args()
    if not args.approved:
        raise ValueError("Refusing to render content that has not been explicitly approved; pass --approved after review.")

    module = read_json(args.package)
    course = module.get("course")
    if not isinstance(course, dict):
        raise ValueError("Package has no course object.")
    source_manifest = [entry for entry in module.get("sourceManifest", []) if isinstance(entry, dict)]
    review_chapter = next((chapter for chapter in course.get("chapters", []) if isinstance(chapter, dict) and chapter.get("id") == "chapter-openjlpt-review"), None)
    if not isinstance(review_chapter, dict):
        raise ValueError("Package has no source-review chapter.")
    review_lesson = next((lesson for lesson in review_chapter.get("lessons", []) if isinstance(lesson, dict)), None)
    if not isinstance(review_lesson, dict):
        raise ValueError("Source-review chapter has no lesson.")
    chapters = dicts(course.get("chapters"))
    real_chapters = [chapter for chapter in chapters if text(chapter.get("id")) != text(review_chapter.get("id"))]

    source_items: list[dict[str, Any]] = []
    for category in CATEGORIES:
        for item in module.get(category, []):
            if isinstance(item, dict) and "source-review" in strings(item.get("tags")):
                item = {**item, "category": ITEM_TYPES.get(category, category)}
                status = text(item.get("reviewStatus")) or "pending"
                if status not in ("pending", "approved", "rejected"):
                    raise ValueError(f"Item {text(item.get('id')) or category} has an unknown review status: {status}.")
                source_items.append(item)
    items = [item for item in source_items if (text(item.get("reviewStatus")) or "pending") == "approved"]
    if not items:
        raise ValueError("No approved source-review items found; set reviewStatus to approved after checking each record.")
    manifest_ids = {text(source.get("id")) for source in source_manifest}
    missing_sources = sorted({source_id for item in items for source_id in [*strings(item.get("sourceIds")), *field_source_ids(item)] if source_id not in manifest_ids})
    if missing_sources:
        raise ValueError(f"Source manifest is missing item provenance: {', '.join(missing_sources)}")

    item_categories = {
        text(item.get("id")): text(item.get("category"))
        for category in CATEGORIES
        for item in module.get(category, [])
        if isinstance(item, dict)
        and text(item.get("id"))
        and text(item.get("category"))
        and ("source-review" not in strings(item.get("tags")) or (text(item.get("reviewStatus")) or "pending") == "approved")
    }
    questions: list[dict[str, Any]] = []
    if args.questions:
        raw_questions = json.loads(args.questions.read_text(encoding="utf-8"))
        if not isinstance(raw_questions, list):
            raise ValueError("The question export must be a JSON array.")
        questions = [question for question in raw_questions if isinstance(question, dict)]
        if len(questions) != len(raw_questions):
            raise ValueError("The question export must contain only question objects.")
        question_ids: set[str] = set()
        for question in questions:
            question_id = text(question.get("id"))
            if question_id in question_ids:
                raise ValueError(f"Question export contains duplicate id: {question_id or '<unknown>'}.")
            question_ids.add(question_id)
            validate_question(question, item_categories)

    approved_ids = {text(item["id"]) for item in items}
    assignments: dict[str, list[tuple[str, int]]] = {}
    for chapter in real_chapters:
        for lesson in dicts(chapter.get("lessons")):
            lesson_id = text(lesson.get("id"))
            if not lesson_id:
                continue
            for sort_order, item_id in enumerate(strings(lesson.get("itemIds"))):
                if item_id not in approved_ids:
                    continue
                destinations = assignments.setdefault(item_id, [])
                if (lesson_id, sort_order) not in destinations:
                    destinations.append((lesson_id, sort_order))
    unassigned = [text(item["id"]) for item in items if not assignments.get(text(item["id"]), [])]
    if unassigned:
        raise ValueError("Approved source-review items must be assigned to a real Journey lesson before export: " + ", ".join(unassigned[:20]))
    sources_by_id = {text(source.get("id")): source for source in source_manifest if text(source.get("id"))}
    unlicensed = sorted({source_id for item in items for source_id in [*strings(item.get("sourceIds")), *field_source_ids(item)] if (source := sources_by_id.get(source_id)) and text(source.get("type")) != "user" and not source_id.startswith("michi-") and not text(source.get("license"))})
    if unlicensed:
        raise ValueError("Published source records need recorded license terms: " + ", ".join(unlicensed))
    review_items = []
    review_lesson_id = text(review_lesson.get("id"))
    review_lesson = {**review_lesson, "itemIds": [text(item["id"]) for item in review_items]}

    statements = [
        "-- Kizashi reviewed-content import; apply migrations before this file.",
        "begin;",
        *[source_sql(source) for source in source_manifest],
        course_sql(course),
        *[chapter_sql(course, chapter, chapter_order) for chapter_order, chapter in enumerate(real_chapters)],
        *[lesson_sql(chapter, lesson, lesson_order) for chapter in real_chapters for lesson_order, lesson in enumerate(dicts(chapter.get("lessons")))],
        chapter_sql(course, review_chapter, len(real_chapters)),
        lesson_sql(review_chapter, review_lesson, 0),
    ]
    for item in items:
        statements.extend(item_sql(item, text(item["category"])))
        source_ids = strings(item.get("sourceIds"))
        for source_id in source_ids:
            statements.append(f"insert into public.learning_item_sources (item_id, source_id) values ({sql_text(item['id'])}, {sql_text(source_id)}) on conflict do nothing;")
        classification = classification_sql(item)
        if classification:
            statements.append(classification)
    for index, item in enumerate(items):
        destinations = assignments.get(text(item["id"])) or [(review_lesson_id, index)]
        for lesson_id, sort_order in destinations:
            statements.extend(link_sql(item, lesson_id, sort_order))
    statements.extend(question_sql(question, item_categories) for question in questions)
    statements.append("commit;")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text("\n\n".join(statements) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), "items": len(items), "questions": len(questions), "sources": len(source_manifest)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
