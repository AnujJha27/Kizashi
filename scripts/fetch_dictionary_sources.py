#!/usr/bin/env python3
"""Cache approved source artifacts for Kizashi's review-only ingestion pipeline."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import tempfile
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "data" / "source-cache"
OPENJLPT_RAW = "https://raw.githubusercontent.com/evanclan/OpenJLPT/main/data/json"

SOURCES = {
    "jmdict": {
        "filename": "JMdict_e.gz",
        "url": "http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz",
        "fallbacks": [{
            "filename": "JMdict_e.xml",
            "url": "https://raw.githubusercontent.com/daffychuy/JMdict_e-Kanjidic-JSON/master/JMdict_e",
        }],
        "type": "dictionary",
        "license": "EDRDG licence",
        "notes": "Canonical dictionary facts; preserve the upstream notice.",
    },
    "jmdict-examples": {
        "filename": "JMdict_e_examp.gz",
        "url": "http://ftp.edrdg.org/pub/Nihongo/JMdict_e_examp.gz",
        "type": "examples",
        "license": "EDRDG licence",
        "notes": "JMdict-linked examples for later reviewed enrichment; preserve the upstream notice.",
    },
    "kanjidic2": {
        "filename": "kanjidic2.xml.gz",
        "url": "http://ftp.edrdg.org/pub/Nihongo/kanjidic2.xml.gz",
        "fallbacks": [{
            "filename": "kanjidic2.xml",
            "url": "https://raw.githubusercontent.com/daffychuy/JMdict_e-Kanjidic-JSON/master/kanjidic2.xml",
        }],
        "type": "dictionary",
        "license": "CC BY-SA 4.0",
        "notes": "Canonical kanji facts; preserve the upstream notice.",
    },
    "jmnedict": {
        "filename": "JMnedict.xml.gz",
        "url": "http://ftp.edrdg.org/pub/Nihongo/JMnedict.xml.gz",
        "type": "dictionary",
        "license": "EDRDG licence",
        "notes": "Proper-name lookup only; names must not be treated as normal JLPT vocabulary.",
        "optional": True,
    },
    "sudachi-dictionary": {
        "filename": "sudachi-dictionary-latest.zip",
        "url": "https://github.com/WorksApplications/SudachiDict/releases/latest/download/sudachi-dictionary-latest.zip",
        "type": "dictionary",
        "license": "SudachiDict licence; verify the bundled terms before use.",
        "notes": "Morphology, lemmas, conjugation, and sentence linking enrichment only.",
        "optional": True,
    },
    "bccwj-suw": {
        "filename": "BCCWJ_frequencylist_suw_ver1_0.zip",
        "url": "https://repository.ninjal.ac.jp/record/3234/files/BCCWJ_frequencylist_suw_ver1_0.zip",
        "type": "frequency",
        "license": "CC BY-NC-ND 3.0",
        "notes": "Frequency enrichment only; check terms before publishing transformed data.",
    },
    "irodori-wordlist": {
        "filename": "irodori-wordlist_all.xlsx",
        "url": "https://www.irodori.jpf.go.jp/assets/data/wordlist_all.xlsx",
        "type": "curriculum",
        "license": "Japan Foundation official material; verify current terms before publishing.",
        "notes": "Lesson vocabulary and progression reference.",
    },
    "irodori-sentence-patterns": {
        "filename": "irodori-sentence-patterns.xlsx",
        "url": "https://www.irodori.jpf.go.jp/assets/data/sentence_patterns_list.xlsx",
        "type": "curriculum",
        "license": "Japan Foundation official material; verify current terms before publishing.",
        "notes": "Sentence-pattern and grammar sequencing reference.",
    },
    "irodori-kanji": {
        "filename": "irodori-kanji_list.xlsx",
        "url": "https://www.irodori.jpf.go.jp/assets/data/kanji_list.xlsx",
        "type": "curriculum",
        "license": "Japan Foundation official material; verify current terms before publishing.",
        "notes": "Kanji progression reference; dictionary facts still come from KANJIDIC2.",
    },
    "marugoto-starter-vocab": {
        "filename": "marugoto-starter-vocabulary-index-en.pdf",
        "url": "https://marugoto.jpf.go.jp/assets/docs/download/starter_c/MarugotoStarterCompetencesVocabularyIndex_EN.pdf",
        "type": "curriculum",
        "license": "Japan Foundation official material; verify current terms before publishing.",
        "notes": "Starter/A1 vocabulary reference.",
    },
    "marugoto-elementary1-vocab": {
        "filename": "marugoto-elementary1-vocabulary-index-en.pdf",
        "url": "https://marugoto.jpf.go.jp/assets/docs/download/elementary1_c/MarugotoElementary1CompetencesVocabularyIndex_EN.pdf",
        "type": "curriculum",
        "license": "Japan Foundation official material; verify current terms before publishing.",
        "notes": "Elementary 1/A2 vocabulary reference.",
    },
    "marugoto-elementary2-vocab": {
        "filename": "marugoto-elementary2-vocabulary-index-en.pdf",
        "url": "https://marugoto.jpf.go.jp/assets/docs/download/elementary2_c/MarugotoElementary2CompetencesVocabularyIndex_EN.pdf",
        "type": "curriculum",
        "license": "Japan Foundation official material; verify current terms before publishing.",
        "notes": "Elementary 2/A2 vocabulary reference.",
    },
    "tatoeba-jpn-indices": {
        "filename": "jpn_indices.tar.bz2",
        "url": "https://downloads.tatoeba.org/exports/jpn_indices.tar.bz2",
        "type": "examples",
        "license": "Tatoeba data license; retain attribution metadata.",
        "notes": "Japanese sentence index; text export is optional because it is substantially larger.",
    },
    "tatoeba-sentences": {
        "filename": "sentences.tar.bz2",
        "url": "https://downloads.tatoeba.org/exports/sentences.tar.bz2",
        "type": "examples",
        "license": "Tatoeba data license; retain per-sentence attribution metadata.",
        "notes": "English sentence text needed to resolve the Japanese index pairs; retain attribution metadata.",
    },
    "cejc": {
        "filename": "cejc-metadata.txt",
        "url": "https://repository.ninjal.ac.jp/records/2000167",
        "type": "frequency",
        "license": "CEJC-WSD-frequency 2024.03; research/education use free, no redistribution, commercial use by consultation.",
        "notes": "Licensed spoken-frequency evaluation only; the corpus audio, transcripts, and annotations require separate access terms.",
        "optional": True,
    },
    "csj": {
        "filename": "csj-metadata.txt",
        "url": "https://clrd.ninjal.ac.jp/csj/en/",
        "type": "frequency",
        "license": "NINJAL CSJ terms; commercial use requires individual review/license and source data is not redistributable.",
        "notes": "Spoken-frequency and listening-realism evaluation only; do not import corpus data or audio without a matching license.",
        "optional": True,
    },
    "i-jas": {
        "filename": "ijas-terms.pdf",
        "url": "https://chunagon.ninjal.ac.jp/static/I-JAS_TermsOfService.pdf",
        "type": "learner-corpus",
        "license": "I-JAS online terms; research-purpose use by application, no third-party redistribution, commercial use by separate consultation.",
        "notes": "Aggregate learner-error evaluation only; never import learner records or publish derived personal data.",
        "optional": True,
    },
}

GROUPS = {
    "dictionaries": ("jmdict", "kanjidic2"),
    "lookup": ("jmnedict", "sudachi-dictionary"),
    "curriculum": (
        "openjlpt",
        "irodori-wordlist",
        "irodori-sentence-patterns",
        "irodori-kanji",
        "marugoto-starter-vocab",
        "marugoto-elementary1-vocab",
        "marugoto-elementary2-vocab",
    ),
    "frequency": ("bccwj-suw",),
    "examples": ("jmdict-examples", "tatoeba-jpn-indices", "tatoeba-sentences"),
    "spoken-evaluation": ("cejc", "csj"),
    "learner-evaluation": ("i-jas",),
    "core": ("dictionaries", "jmdict-examples", "curriculum", "frequency", "tatoeba-jpn-indices", "tatoeba-sentences"),
}


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def resolve(source_id: str, level: str) -> list[tuple[str, dict[str, str]]]:
    if source_id == "openjlpt":
        return [
            (
                f"openjlpt-{kind}-{level.lower()}",
                {
                    "filename": f"openjlpt-{kind}-{level.lower()}.json",
                    "url": f"{OPENJLPT_RAW}/{kind}/{level.lower()}.json",
                    "type": "curriculum",
                    "license": "CC BY-SA 4.0",
                    "notes": "Community JLPT classification; staging only until reviewed.",
                },
            )
            for kind in ("vocab", "kanji", "grammar")
        ]
    if source_id in SOURCES:
        return [(source_id, SOURCES[source_id])]
    raise ValueError(f"Unknown source or group: {source_id}")


def expand(requested: list[str], level: str) -> list[tuple[str, dict[str, str]]]:
    result: list[tuple[str, dict[str, str]]] = []
    seen: set[str] = set()

    def add(source_id: str) -> None:
        if source_id in GROUPS:
            for child in GROUPS[source_id]:
                add(child)
            return
        for resolved_id, spec in resolve(source_id, level):
            if resolved_id not in seen:
                seen.add(resolved_id)
                result.append((resolved_id, spec))

    for source_id in requested:
        add(source_id)
    return result


def fetch(source_id: str, spec: dict[str, object], cache_dir: Path, force: bool) -> dict[str, str | int]:
    candidates = [spec, *(entry for entry in spec.get("fallbacks", []) if isinstance(entry, dict))]
    errors: list[str] = []
    for candidate in candidates:
        filename = candidate.get("filename")
        url = candidate.get("url")
        if not isinstance(filename, str) or not isinstance(url, str):
            continue
        target = cache_dir / filename
        if not force and target.exists() and target.stat().st_size > 0:
            return {"status": "cached", "filename": target.name, "url": url, "bytes": target.stat().st_size, "sha256": sha256(target)}

        with tempfile.NamedTemporaryFile(dir=cache_dir, prefix=f"{source_id}-", delete=False) as temporary:
            temporary_path = Path(temporary.name)
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "kizashi-source-cache/1.0"})
            with urllib.request.urlopen(request, timeout=120) as response, temporary_path.open("wb") as output:
                shutil.copyfileobj(response, output)
            if temporary_path.stat().st_size == 0:
                raise OSError(f"empty response for {source_id}")
            temporary_path.replace(target)
            return {"status": "downloaded", "filename": target.name, "url": url, "bytes": target.stat().st_size, "sha256": sha256(target)}
        except (OSError, TimeoutError, urllib.error.URLError) as error:
            if isinstance(error, PermissionError) and target.is_file() and target.stat().st_size > 0 and not force:
                return {"status": "cached", "filename": target.name, "url": url, "bytes": target.stat().st_size, "sha256": sha256(target)}
            errors.append(f"{url}: {error}")
        finally:
            temporary_path.unlink(missing_ok=True)

    if spec.get("optional"):
        return {"status": "unavailable", "filename": str(spec.get("filename", "")), "url": str(spec.get("url", "")), "bytes": 0, "sha256": "", "error": "; ".join(errors)}
    raise OSError(f"could not fetch {source_id}: {'; '.join(errors)}")


def print_sources() -> None:
    print("Groups:")
    for group, source_ids in GROUPS.items():
        print(f"  {group}: {', '.join(source_ids)}")
    print("Sources:")
    for source_id, spec in SOURCES.items():
        print(f"  {source_id}: {spec['filename']}")
    print("  openjlpt: vocab, kanji, and grammar JSON for --level")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", action="append", dest="sources", help="Source or group; repeat for more than one.")
    parser.add_argument("--level", choices=("N5", "N4", "N3", "N2", "N1"), default="N5")
    parser.add_argument("--cache-dir", type=Path, default=CACHE, help="Directory for downloaded artifacts and manifest.")
    parser.add_argument("--force", action="store_true", help="Download fresh copies even when a cache file exists.")
    parser.add_argument("--list", action="store_true", help="List groups and sources without downloading.")
    args = parser.parse_args()

    if args.list:
        print_sources()
        return 0

    args.cache_dir.mkdir(parents=True, exist_ok=True)
    selected = expand(args.sources or ["core"], args.level)
    previous: dict[str, object] = {}
    manifest_path = args.cache_dir / "manifest.json"
    if manifest_path.exists():
        try:
            raw_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            previous = raw_manifest.get("sources", {}) if isinstance(raw_manifest, dict) else {}
        except (OSError, json.JSONDecodeError):
            previous = {}

    manifest_sources: dict[str, dict[str, object]] = {
        source_id: entry
        for source_id, entry in previous.items()
        if isinstance(entry, dict) and isinstance(entry.get("filename"), str) and (args.cache_dir / entry["filename"]).is_file()
    }
    for source_id, spec in selected:
        result = fetch(source_id, spec, args.cache_dir, args.force)
        old_entry = previous.get(source_id) if isinstance(previous, dict) else None
        entry: dict[str, object] = {"id": source_id, **spec, **result, "checkedAt": now()}
        if result["status"] == "cached" and isinstance(old_entry, dict) and old_entry.get("retrievedAt"):
            entry["retrievedAt"] = old_entry["retrievedAt"]
        else:
            entry["retrievedAt"] = now()
        manifest_sources[source_id] = entry

    previous_levels = previous.get("levels", []) if isinstance(previous, dict) and isinstance(previous.get("levels"), list) else []
    levels = sorted({level for level in [*previous_levels, args.level] if isinstance(level, str)})
    manifest = {
        "schemaVersion": 1,
        "level": args.level,
        "levels": levels,
        "generatedAt": now(),
        "sources": manifest_sources,
        "policy": "Artifacts are staging inputs. Review provenance and license terms before publishing derived content.",
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for source_id, entry in manifest_sources.items():
        print(f"{source_id}: {entry['status']} {entry['filename']} ({entry['bytes']} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
