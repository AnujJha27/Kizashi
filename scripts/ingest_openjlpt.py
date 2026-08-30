#!/usr/bin/env python3
"""Build a review-only JLPT content package from OpenJLPT and local enrichments.

This intentionally writes a staging JSON file. It never edits the active app
curriculum or Supabase. Review and map staged records before publishing them.
"""

from __future__ import annotations

import argparse
import csv
import gzip
import hashlib
import io
import json
import re
import sys
import tarfile
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


OPENJLPT_RAW = "https://raw.githubusercontent.com/evanclan/OpenJLPT/main/data/json"
LEVELS = {"N5", "N4", "N3", "N2", "N1"}
TIMEOUT_SECONDS = 30
KATAKANA_TO_HIRAGANA = str.maketrans({chr(code): chr(code - 0x60) for code in range(0x30A1, 0x30F7)})
KANA_ONLY = re.compile(r"^[ぁ-んァ-ヶー・]+$")
JM_POS_LABELS = {
    "n": "noun",
    "n-adv": "adverbial noun",
    "n-pr": "proper noun",
    "n-pref": "noun used as a prefix",
    "n-suf": "noun used as a suffix",
    "n-t": "temporal noun",
    "v1": "ichidan verb",
    "v5aru": "godan verb (ある)",
    "v5b": "godan verb ending in ぶ",
    "v5g": "godan verb ending in ぐ",
    "v5k": "godan verb ending in く",
    "v5k-s": "godan verb - iku/yuku special class",
    "v5m": "godan verb ending in む",
    "v5n": "godan verb ending in ぬ",
    "v5r": "godan verb ending in る",
    "v5r-i": "godan verb - aru special class",
    "v5s": "godan verb ending in す",
    "v5t": "godan verb ending in つ",
    "v5u": "godan verb ending in う",
    "v5u-s": "godan verb - uru special class",
    "vk": "kuru verb",
    "vs": "suru verb",
    "vs-i": "suru verb - irregular",
    "vs-s": "suru verb - special class",
    "vi": "intransitive verb",
    "vt": "transitive verb",
    "adj-i": "i-adjective",
    "adj-na": "na-adjective",
    "adj-no": "noun-adjectival",
    "adj-pn": "pre-noun adjectival",
    "adv": "adverb",
    "adv-to": "adverb taking と",
    "aux": "auxiliary",
    "aux-adj": "auxiliary adjective",
    "aux-v": "auxiliary verb",
    "conj": "conjunction",
    "cop": "copula",
    "ctr": "counter",
    "exp": "expression",
    "int": "interjection",
    "num": "numeric",
    "pn": "pronoun",
    "pref": "prefix",
    "prt": "particle",
    "suf": "suffix",
}


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def text(value: Any) -> str:
    return value.strip() if isinstance(value, str) else ""


def strings(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [entry.strip() for entry in value if isinstance(entry, str) and entry.strip()]


def hiragana(value: str) -> str:
    return value.translate(KATAKANA_TO_HIRAGANA)


def add_field_source(item: dict[str, Any], field: str, source_id: str) -> None:
    field_sources = item.setdefault("fieldSourceIds", {})
    if not isinstance(field_sources, dict):
        field_sources = {}
        item["fieldSourceIds"] = field_sources
    values = field_sources.get(field) if isinstance(field_sources.get(field), list) else []
    field_sources[field] = list(dict.fromkeys([*strings(values), source_id]))


def records(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [entry for entry in payload if isinstance(entry, dict)]
    if isinstance(payload, dict):
        for key in ("data", "items", "records"):
            if isinstance(payload.get(key), list):
                return [entry for entry in payload[key] if isinstance(entry, dict)]
    raise ValueError("Expected a JSON array or an object containing data/items/records.")


def fetch_json(url: str) -> tuple[Any, str]:
    request = urllib.request.Request(url, headers={"User-Agent": "kizashi-content-stager/1.0"})
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        raw = response.read()
    return json.loads(raw), hashlib.sha256(raw).hexdigest()


def read_json(path: Path) -> tuple[Any, str]:
    raw = path.read_bytes()
    return json.loads(raw), hashlib.sha256(raw).hexdigest()


def file_checksum(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def first_existing(directory: Path, *names: str) -> Path:
    return next((directory / name for name in names if (directory / name).is_file()), directory / names[0])


def stable_id(kind: str, *values: str) -> str:
    digest = hashlib.sha1("|".join(values).encode("utf-8")).hexdigest()[:12]
    return f"openjlpt-{kind}-{digest}"


def examples(value: Any) -> list[dict[str, str]]:
    if not isinstance(value, list):
        return []
    result = []
    for entry in value:
        if not isinstance(entry, dict):
            continue
        japanese = text(entry.get("ja") or entry.get("japanese"))
        translation = text(entry.get("en") or entry.get("english") or entry.get("translation"))
        if japanese and translation:
            result.append({"japanese": japanese, "translation": translation})
    return result


def classification(level: str, retrieved_at: str, item_type: str, item_id: str) -> dict[str, Any]:
    return {
        "itemType": item_type,
        "itemId": item_id,
        "level": level,
        "band": "bridge" if level != "N5" else "extended",
        "confidence": "medium",
        "evidenceSources": ["openjlpt"],
        "inclusionReason": "OpenJLPT community classification; review before publishing.",
        "reviewedAt": retrieved_at[:10],
    }


def normalize_vocab(record: dict[str, Any], level: str, retrieved_at: str) -> dict[str, Any] | None:
    word = text(record.get("word") or record.get("writtenForm"))
    if not word:
        return None
    written = word.split("/", 1)[0].strip()
    reading = text(record.get("reading")) or (written if KANA_ONLY.fullmatch(written) else "")
    if not written:
        return None
    item_id = stable_id("vocabulary", written, reading or word)
    return {
        "id": item_id,
        "slug": item_id,
        "category": "vocabulary",
        "reviewStatus": "pending",
        "title": written,
        "jlptLevel": level,
        "writtenForm": written,
        "reading": reading,
        "meanings": strings(record.get("meanings")),
        "partOfSpeech": text(record.get("partOfSpeech") or record.get("part_of_speech")) or "unknown",
        "exampleSentences": examples(record.get("examples")),
        "sourceIds": ["openjlpt"],
        "classification": classification(level, retrieved_at, "vocabulary", item_id),
        "sourceRecord": record,
    }


def normalize_kanji(record: dict[str, Any], level: str, retrieved_at: str) -> dict[str, Any] | None:
    character = text(record.get("character") or record.get("literal"))
    if not character:
        return None
    item_id = stable_id("kanji", character)
    return {
        "id": item_id,
        "slug": item_id,
        "category": "kanji",
        "reviewStatus": "pending",
        "title": character,
        "jlptLevel": level,
        "character": character,
        "meanings": strings(record.get("meanings")),
        "onyomi": strings(record.get("onyomi") or record.get("on readings")),
        "kunyomi": strings(record.get("kunyomi") or record.get("kun readings")),
        "strokeCount": record.get("strokes") or record.get("strokeCount"),
        "grade": record.get("grade"),
        "usefulWords": [],
        "sourceIds": ["openjlpt"],
        "classification": classification(level, retrieved_at, "kanji", item_id),
        "sourceRecord": record,
    }


def normalize_grammar(record: dict[str, Any], level: str, retrieved_at: str) -> dict[str, Any] | None:
    pattern = text(record.get("pattern") or record.get("title"))
    if not pattern:
        return None
    item_id = stable_id("grammar", pattern)
    return {
        "id": item_id,
        "slug": item_id,
        "category": "grammar",
        "reviewStatus": "pending",
        "title": pattern,
        "jlptLevel": level,
        "pattern": pattern,
        "meaning": text(record.get("meaning")),
        "formation": text(record.get("formation")),
        "examples": examples(record.get("examples")),
        "tags": strings(record.get("tags")),
        "sourceIds": ["openjlpt"],
        "classification": classification(level, retrieved_at, "grammar", item_id),
        "sourceRecord": record,
    }


def open_file(path: Path):
    return gzip.open(path, "rb") if path.suffix == ".gz" else path.open("rb")


def xml_text(node: ET.Element | None, path: str) -> str:
    value = node.findtext(path) if node is not None else None
    return value.strip() if value else ""


def jmdict_index(path: Path) -> dict[tuple[str, str], dict[str, Any]]:
    index: dict[tuple[str, str], dict[str, Any]] = {}
    with open_file(path) as stream:
        for _, entry in ET.iterparse(stream, events=("end",)):
            if entry.tag != "entry":
                continue
            written = [text(node.text) for node in entry.findall("k_ele/keb") if text(node.text)]
            readings = [text(node.text) for node in entry.findall("r_ele/reb") if text(node.text)]
            meanings = [text(node.text) for node in entry.findall("sense/gloss") if text(node.text) and node.attrib.get("{http://www.w3.org/XML/1998/namespace}lang", "eng") == "eng"]
            parts = [text(node.text) for node in entry.findall("sense/pos") if text(node.text)]
            example_sentences = []
            for example in entry.findall("sense/example"):
                japanese = next((text(node.text) for node in example.findall("ex_sent") if node.attrib.get("{http://www.w3.org/XML/1998/namespace}lang") == "jpn" and text(node.text)), "")
                translation = next((text(node.text) for node in example.findall("ex_sent") if node.attrib.get("{http://www.w3.org/XML/1998/namespace}lang") == "eng" and text(node.text)), "")
                if japanese and translation:
                    example_sentences.append({"japanese": japanese, "translation": translation})
            sequence = xml_text(entry, "ent_seq")
            value = {"sequence": sequence, "writtenForms": written, "readings": readings, "meanings": meanings[:8], "partsOfSpeech": sorted({JM_POS_LABELS.get(part, part) for part in parts}), "partsOfSpeechRaw": sorted(set(parts)), "exampleSentences": example_sentences[:3]}
            for word in written:
                for reading in readings or [""]:
                    index[(word, reading)] = value
            for reading in readings:
                index.setdefault((reading, reading), value)
            entry.clear()
    return index


def kanjidic_index(path: Path) -> dict[str, dict[str, Any]]:
    index: dict[str, dict[str, Any]] = {}
    with open_file(path) as stream:
        for _, entry in ET.iterparse(stream, events=("end",)):
            if entry.tag != "character":
                continue
            character = xml_text(entry, "literal")
            meanings = [text(node.text) for node in entry.findall("reading_meaning/rmgroup/meaning") if text(node.text) and node.attrib.get("m_lang", "en") == "en"]
            readings = entry.findall("reading_meaning/rmgroup/reading")
            if character:
                index[character] = {
                    "meanings": meanings[:8],
                    "onyomi": [text(node.text) for node in readings if node.attrib.get("r_type") == "ja_on" and text(node.text)],
                    "kunyomi": [text(node.text) for node in readings if node.attrib.get("r_type") == "ja_kun" and text(node.text)],
                    "strokeCount": next((int(text(node.text)) for node in entry.findall("misc/stroke_count") if text(node.text).isdigit()), None),
                    "grade": next((int(text(node.text)) for node in entry.findall("misc/grade") if text(node.text).isdigit()), None),
                }
            entry.clear()
    return index


def number(value: Any, integer = False) -> int | float | None:
    try:
        parsed = float(str(value).replace(",", "").strip())
    except (TypeError, ValueError):
        return None
    return int(parsed) if integer else parsed


def bccwj_index(path: Path) -> dict[tuple[str, str], dict[str, Any]]:
    index: dict[tuple[str, str], dict[str, Any]] = {}
    with zipfile.ZipFile(path) as archive:
        members = sorted(name for name in archive.namelist() if name.lower().endswith((".tsv", ".txt", ".csv")))
        for member in members:
            with archive.open(member) as binary:
                stream = io.TextIOWrapper(binary, encoding="utf-8-sig", errors="replace", newline="")
                reader = csv.reader(stream, delimiter="\t")
                header = next(reader, [])
                fields = {text(value).lower().replace(" ", ""): index for index, value in enumerate(header)}
                lemma_column = next((fields.get(name) for name in ("lemma", "語彙素") if fields.get(name) is not None), None)
                frequency_column = next((fields.get(name) for name in ("frequency", "頻度") if fields.get(name) is not None), None)
                if lemma_column is None or frequency_column is None:
                    continue
                reading_column = next((fields.get(name) for name in ("lform", "語彙素読み") if fields.get(name) is not None), None)
                rank_column = next((fields.get(name) for name in ("rank", "順位") if fields.get(name) is not None), None)
                pmw_column = next((fields.get(name) for name in ("pmw",) if fields.get(name) is not None), None)
                pos_column = next((fields.get(name) for name in ("pos", "品詞") if fields.get(name) is not None), None)
                for row in reader:
                    lemma = text(row[lemma_column] if lemma_column < len(row) else "")
                    frequency = number(row[frequency_column] if frequency_column < len(row) else "", integer=True)
                    if not lemma or not isinstance(frequency, int):
                        continue
                    reading = hiragana(text(row[reading_column] if reading_column is not None and reading_column < len(row) else ""))
                    entry = {
                        "rank": number(row[rank_column] if rank_column is not None and rank_column < len(row) else "", integer=True),
                        "frequency": frequency,
                        "pmw": number(row[pmw_column] if pmw_column is not None and pmw_column < len(row) else ""),
                        "partOfSpeech": text(row[pos_column] if pos_column is not None and pos_column < len(row) else ""),
                    }
                    index.setdefault((lemma, reading), entry)
                    index.setdefault((lemma, ""), entry)
                if index:
                    return index
    raise ValueError(f"No BCCWJ frequency table found in {path}.")


def commonness_from_rank(rank: Any) -> int | None:
    if not isinstance(rank, int) or rank < 1:
        return None
    if rank <= 1_000:
        return 5
    if rank <= 5_000:
        return 4
    if rank <= 20_000:
        return 3
    if rank <= 80_000:
        return 2
    return 1


def tatoeba_rows(path: Path, member_fragment: str):
    if path.name.endswith(".tar.bz2"):
        with path.open("rb") as binary, tarfile.open(fileobj=binary, mode="r|bz2") as archive:
            for member in archive:
                if not member.isfile() or member_fragment not in Path(member.name).name:
                    continue
                stream = archive.extractfile(member)
                if stream is None:
                    continue
                pending = b""
                while chunk := stream.read(1024 * 1024):
                    lines = (pending + chunk).split(b"\n")
                    pending = lines.pop()
                    for line in lines:
                        yield line.decode("utf-8", errors="replace").rstrip("\r").split("\t")
                if pending:
                    yield pending.decode("utf-8", errors="replace").rstrip("\r").split("\t")
                return
        return
    with open_file(path) as binary:
        for row in csv.reader((line.decode("utf-8", errors="replace") for line in binary), delimiter="\t"):
            yield row


def tatoeba_english_sentences(path: Path, sentence_ids: set[str]) -> dict[str, str]:
    result: dict[str, str] = {}
    for row in tatoeba_rows(path, "sentences"):
        if len(row) < 3 or row[1].strip() != "eng":
            continue
        sentence_id, english = row[0].strip(), row[2].strip()
        if sentence_id in sentence_ids and english:
            result[sentence_id] = english
    return result


def tatoeba_pairs(index_path: Path, sentences_path: Path | None, wanted_words: set[str], limit: int) -> list[dict[str, str]]:
    pending: list[dict[str, str]] = []
    for row in tatoeba_rows(index_path, "jpn_indices"):
        if len(row) >= 4:
            sentence_id, meaning_id, japanese, english = (entry.strip() for entry in row[:4])
            indices = row[4].strip() if len(row) > 4 else ""
            if japanese and english and any(word in japanese for word in wanted_words):
                pending.append({"japanese": japanese, "translation": english, "sourceId": "tatoeba-jpn-indices", "sentenceId": sentence_id, "meaningId": meaning_id, "indices": indices})
        elif len(row) >= 3:
            sentence_id, meaning_id, japanese = (entry.strip() for entry in row[:3])
            if sentence_id and meaning_id and japanese and any(word in japanese for word in wanted_words):
                pending.append({"japanese": japanese, "translation": "", "sourceId": "tatoeba-jpn-indices", "sentenceId": sentence_id, "meaningId": meaning_id, "indices": ""})
        if len(pending) >= limit:
            break
    if not pending or sentences_path is None or not sentences_path.exists():
        return [pair for pair in pending if pair["translation"]]
    translations = tatoeba_english_sentences(sentences_path, {pair["meaningId"] for pair in pending})
    return [pair | {"translation": translations.get(pair["meaningId"], ""), "sourceId": "tatoeba-sentences"} for pair in pending if translations.get(pair["meaningId"])]


def tatoeba_examples(item: dict[str, Any], pairs: list[dict[str, str]], limit: int = 2) -> list[dict[str, str]]:
    written = text(item.get("writtenForm"))
    result: list[dict[str, str]] = []
    for pair in pairs:
        indices = pair.get("indices", "")
        japanese = pair.get("japanese", "")
        if not ((written and written in indices) or (written and written in japanese)):
            continue
        candidate = {
            "japanese": japanese,
            "translation": pair["translation"],
            "sourceId": "tatoeba",
            "sentenceId": pair.get("sentenceId", ""),
            "translationId": pair.get("meaningId", ""),
            "license": "CC BY 2.0 FR and per-contributor licenses",
        }
        if candidate not in result:
            result.append(candidate)
        if len(result) >= limit:
            break
    return result


def source_record(source_id: str, name: str, source_type: str, url: str, license_name: str, retrieved_at: str, checksum: str | None = None, notes: str = "") -> dict[str, Any]:
    record = {"id": source_id, "name": name, "type": source_type, "url": url, "license": license_name, "retrievedAt": retrieved_at, "notes": notes}
    if checksum:
        record["sha256"] = checksum
    return record


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--level", choices=sorted(LEVELS), default="N5")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--jmdict", type=Path, help="Optional JMdict XML/XML.GZ for vocabulary enrichment.")
    parser.add_argument("--jmdict-examples", type=Path, help="Optional JMdict XML/XML.GZ with linked example sentences.")
    parser.add_argument("--kanjidic2", type=Path, help="Optional KANJIDIC2 XML/XML.GZ for kanji enrichment.")
    parser.add_argument("--bccwj", type=Path, help="Optional BCCWJ frequency ZIP for vocabulary enrichment.")
    parser.add_argument("--tatoeba", type=Path, help="Optional Tatoeba jpn_indices TSV or TAR.BZ2 export.")
    parser.add_argument("--tatoeba-sentences", type=Path, help="Optional Tatoeba sentences TSV or TAR.BZ2 export used to resolve English pairs.")
    parser.add_argument("--tatoeba-limit", type=int, default=5000)
    parser.add_argument("--cache-dir", type=Path, default=Path("data/source-cache"), help="Acquisition cache directory.")
    parser.add_argument("--online", action="store_true", help="Fetch OpenJLPT online even when cached JSON exists.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    level = args.level.lower()
    retrieved_at = now()
    output = args.output or Path("data/staging") / f"openjlpt-{level}.json"
    sources = [source_record("openjlpt", "OpenJLPT", "curriculum", "https://github.com/evanclan/OpenJLPT", "CC BY-SA 4.0", retrieved_at, notes="Community JLPT classification; staging only until reviewed.")]
    raw_by_kind: dict[str, list[dict[str, Any]]] = {}

    for kind in ("vocab", "kanji", "grammar"):
        url = f"{OPENJLPT_RAW}/{kind}/{level}.json"
        cached = args.cache_dir / f"openjlpt-{kind}-{level}.json"
        payload, checksum = read_json(cached) if cached.exists() and not args.online else fetch_json(url)
        raw_by_kind[kind] = records(payload)
        source = source_record(f"openjlpt-{kind}-{level}", f"OpenJLPT {kind} {args.level}", "curriculum", url, "CC BY-SA 4.0", retrieved_at, checksum)
        if cached.exists() and not args.online:
            source["localFilename"] = cached.name
        sources.append(source)

    vocabulary = [item for record in raw_by_kind["vocab"] if (item := normalize_vocab(record, args.level, retrieved_at))]
    kanji = [item for record in raw_by_kind["kanji"] if (item := normalize_kanji(record, args.level, retrieved_at))]
    grammar = [item for record in raw_by_kind["grammar"] if (item := normalize_grammar(record, args.level, retrieved_at))]
    for item in vocabulary:
        source_id = f"openjlpt-vocab-{level}"
        item["sourceIds"] = [source_id]
        item["fieldSourceIds"] = {field: [source_id] for field in ("writtenForm", "reading", "meanings", "partOfSpeech", "exampleSentences", "classification")}
    for item in kanji:
        source_id = f"openjlpt-kanji-{level}"
        item["sourceIds"] = [source_id]
        item["fieldSourceIds"] = {field: [source_id] for field in ("character", "meanings", "onyomi", "kunyomi", "usefulWords", "classification")}
    for item in grammar:
        source_id = f"openjlpt-grammar-{level}"
        item["sourceIds"] = [source_id]
        item["fieldSourceIds"] = {field: [source_id] for field in ("pattern", "meaning", "formation", "examples", "classification")}

    jmdict_path = args.jmdict or first_existing(args.cache_dir, "JMdict_e.gz", "JMdict_e.xml")
    if jmdict_path.exists():
        dictionary = jmdict_index(jmdict_path)
        for item in vocabulary:
            match = dictionary.get((item["writtenForm"], item["reading"])) or dictionary.get((item["writtenForm"], ""))
            if match:
                item["dictionary"] = match
                item["reading"] = item["reading"] or (match["readings"][0] if match["readings"] else "")
                item["sourceIds"].append("jmdict")
                for field in ("reading", "meanings", "partOfSpeech"):
                    add_field_source(item, field, "jmdict")
        source = source_record("jmdict", "JMdict", "dictionary", "https://www.edrdg.org/jmdict/j_jmdict.html", "EDRDG licence", retrieved_at, file_checksum(jmdict_path), notes="Local XML enrichment; verify current license notice with the downloaded file.")
        source["localFilename"] = jmdict_path.name
        sources.append(source)

    jmdict_examples_path = args.jmdict_examples or first_existing(args.cache_dir, "JMdict_e_examp.gz", "JMdict_e_examp.xml")
    if jmdict_examples_path.exists():
        dictionary = jmdict_index(jmdict_examples_path)
        for item in vocabulary:
            match = dictionary.get((item["writtenForm"], item["reading"])) or dictionary.get((item["writtenForm"], ""))
            if match and match["exampleSentences"]:
                item["exampleSentences"] = [*item["exampleSentences"], *match["exampleSentences"]][:3]
                item["sourceIds"].append("jmdict-examples")
                add_field_source(item, "exampleSentences", "jmdict-examples")
        source = source_record("jmdict-examples", "JMdict linked examples", "examples", "https://ftp.edrdg.org/pub/Nihongo/00INDEX.html", "EDRDG licence", retrieved_at, file_checksum(jmdict_examples_path), notes="Linked example candidates are staged for human review; preserve the upstream notice and source linkage before publishing.")
        source["localFilename"] = jmdict_examples_path.name
        sources.append(source)

    kanjidic2_path = args.kanjidic2 or first_existing(args.cache_dir, "kanjidic2.xml.gz", "kanjidic2.xml")
    if kanjidic2_path.exists():
        dictionary = kanjidic_index(kanjidic2_path)
        for item in kanji:
            match = dictionary.get(item["character"])
            if match:
                item["dictionary"] = match
                item["sourceIds"].append("kanjidic2")
                for field in ("meanings", "onyomi", "kunyomi", "strokeCount", "grade"):
                    add_field_source(item, field, "kanjidic2")
        source = source_record("kanjidic2", "KANJIDIC2", "dictionary", "https://www.edrdg.org/wiki/KANJIDIC_Project.html", "CC BY-SA 4.0", retrieved_at, file_checksum(kanjidic2_path), notes="Local XML enrichment; preserve the upstream notice with the downloaded file.")
        source["localFilename"] = kanjidic2_path.name
        sources.append(source)

    bccwj_path = args.bccwj or args.cache_dir / "BCCWJ_frequencylist_suw_ver1_0.zip"
    if bccwj_path.exists():
        frequencies = bccwj_index(bccwj_path)
        for item in vocabulary:
            match = frequencies.get((item["writtenForm"], hiragana(item["reading"]))) or frequencies.get((item["writtenForm"], ""))
            if match:
                item["commonness"] = commonness_from_rank(match.get("rank"))
                item["frequency"] = match["frequency"]
                item["frequencyMetadata"] = match
                item["sourceIds"].append("bccwj")
                add_field_source(item, "frequency", "bccwj")
                add_field_source(item, "frequencyMetadata", "bccwj")
        source = source_record("bccwj", "NINJAL BCCWJ frequency list", "frequency", "https://clrd.ninjal.ac.jp/bccwj/freq-list.html", "CC BY-NC-ND 3.0", retrieved_at, file_checksum(bccwj_path), notes="Frequency enrichment only; retain the upstream terms and do not treat frequency as JLPT classification.")
        source["localFilename"] = bccwj_path.name
        sources.append(source)

    tatoeba = []
    tatoeba_path = args.tatoeba or args.cache_dir / "jpn_indices.tar.bz2"
    tatoeba_sentences_path = args.tatoeba_sentences or args.cache_dir / "sentences.tar.bz2"
    if tatoeba_path.exists():
        tatoeba = tatoeba_pairs(tatoeba_path, tatoeba_sentences_path, {item["writtenForm"] for item in vocabulary}, max(1, args.tatoeba_limit))
        for item in vocabulary:
            candidates = tatoeba_examples(item, tatoeba)
            if candidates:
                item["exampleSentences"] = [*item["exampleSentences"], *candidates][:3]
                item["sourceIds"].append("tatoeba-jpn-indices")
                add_field_source(item, "exampleSentences", "tatoeba-jpn-indices")
                if tatoeba_sentences_path.exists():
                    item["sourceIds"].append("tatoeba-sentences")
                    add_field_source(item, "exampleSentences", "tatoeba-sentences")
        source = source_record("tatoeba-jpn-indices", "Tatoeba Japanese indices", "examples", "https://tatoeba.org/en/downloads", "Tatoeba data license", retrieved_at, file_checksum(tatoeba_path), notes="Japanese-English sentence pair candidates; retain per-sentence attribution before publishing.")
        source["localFilename"] = tatoeba_path.name
        sources.append(source)
        if tatoeba_sentences_path.exists():
            source = source_record("tatoeba-sentences", "Tatoeba sentences", "examples", "https://tatoeba.org/en/downloads", "Tatoeba data license", retrieved_at, file_checksum(tatoeba_sentences_path), notes="English sentence text used to resolve Japanese index pairs; retain per-sentence attribution before publishing.")
            source["localFilename"] = tatoeba_sentences_path.name
            sources.append(source)

    package = {
        "schemaVersion": 1,
        "status": "staged",
        "level": args.level,
        "generatedAt": retrieved_at,
        "sourcePolicy": "Review mappings and examples before publishing to the active curriculum.",
        "sources": sources,
        "records": {"vocabulary": vocabulary, "kanji": kanji, "grammar": grammar, "tatoebaExamples": tatoeba},
        "stats": {"vocabulary": len(vocabulary), "kanji": len(kanji), "grammar": len(grammar), "tatoebaExamples": len(tatoeba)},
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "stats": package["stats"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, urllib.error.URLError, json.JSONDecodeError) as error:
        print(f"ingest failed: {error}", file=sys.stderr)
        raise SystemExit(1)
