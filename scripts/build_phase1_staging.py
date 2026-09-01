#!/usr/bin/env python3
"""Run Kizashi's cache-first Phase 1 content acquisition pipeline.

This creates ignored, review-only staging JSON. It never edits the active
curriculum, connects to Supabase, or publishes imported records.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
CACHE = ROOT / "data" / "source-cache"


def run(script: str, *arguments: str) -> None:
    command = [sys.executable, str(SCRIPTS / script), *arguments]
    print("$ " + " ".join(command))
    subprocess.run(command, cwd=ROOT, check=True)


def require_cached(level: str, cache_dir: Path) -> None:
    required = [(f"openjlpt-{kind}-{level.lower()}.json",) for kind in ("vocab", "kanji", "grammar")] + [
        ("JMdict_e.gz", "JMdict_e.xml"),
        ("JMdict_e_examp.gz", "JMdict_e_examp.xml"),
        ("kanjidic2.xml.gz", "kanjidic2.xml"),
        ("BCCWJ_frequencylist_suw_ver1_0.zip",),
        ("irodori-wordlist_all.xlsx",),
        ("irodori-sentence-patterns.xlsx",),
        ("irodori-kanji_list.xlsx",),
    ]
    missing = [" or ".join(names) for names in required if not any((cache_dir / name).is_file() for name in names)]
    if missing:
        raise FileNotFoundError("Offline staging is missing cached artifacts: " + ", ".join(missing))


def cached_path(cache_dir: Path, *names: str) -> Path:
    return next((cache_dir / name for name in names if (cache_dir / name).is_file()), cache_dir / names[0])


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--level", choices=("N5",), default="N5", help="Core level represented by the current base package.")
    parser.add_argument("--bridge-level", action="append", choices=("N4",), default=[], help="Also acquire this higher level into the core review queue; repeat for future bridge levels.")
    parser.add_argument("--cache-dir", type=Path, default=CACHE, help="Directory containing source artifacts and receiving staging outputs.")
    parser.add_argument("--force", action="store_true", help="Refresh cached artifacts before staging.")
    parser.add_argument("--offline", action="store_true", help="Use only artifacts already present in data/source-cache.")
    args = parser.parse_args()
    cache_dir = args.cache_dir if args.cache_dir.is_absolute() else ROOT / args.cache_dir
    cache_dir = cache_dir.resolve()

    levels = list(dict.fromkeys([args.level, *args.bridge_level]))
    for requested_level in levels:
        cache_args = ["--source", "core", "--level", requested_level, "--cache-dir", str(cache_dir)]
        if args.force and not args.offline:
            cache_args.append("--force")
        if args.offline:
            require_cached(requested_level, cache_dir)
        else:
            run("fetch_dictionary_sources.py", *cache_args)

    level = args.level.lower()
    jmdict_path = cached_path(cache_dir, "JMdict_e.gz", "JMdict_e.xml")
    staged_openjlpt: list[Path] = []
    for requested_level in levels:
        staged_path = ROOT / "data" / "staging" / f"openjlpt-{requested_level.lower()}.json"
        run("ingest_openjlpt.py", "--level", requested_level, "--cache-dir", str(cache_dir), "--output", str(staged_path))
        staged_openjlpt.append(staged_path)
    run("ingest_irodori_wordlist.py", "--input", str(cache_dir / "irodori-wordlist_all.xlsx"))
    run("ingest_irodori_sentence_patterns.py", "--input", str(cache_dir / "irodori-sentence-patterns.xlsx"))
    run("ingest_irodori_kanji.py", "--input", str(cache_dir / "irodori-kanji_list.xlsx"))
    extras = [
        "--extra", "data/staging/irodori-vocabulary.json",
        "--extra", "data/staging/irodori-grammar.json",
        "--extra", "data/staging/irodori-kanji.json",
    ]
    marugoto_inputs = [
        str(cache_dir / "marugoto-starter-vocabulary-index-en.pdf"),
        str(cache_dir / "marugoto-elementary1-vocabulary-index-en.pdf"),
        str(cache_dir / "marugoto-elementary2-vocabulary-index-en.pdf"),
    ]
    if shutil.which("pdftotext") and all(Path(path).is_file() for path in marugoto_inputs):
        run("ingest_marugoto_vocab.py", "--jmdict", str(jmdict_path), *sum((["--input", path] for path in marugoto_inputs), []))
        extras.extend(["--extra", "data/staging/marugoto-vocabulary.json"])
    else:
        print("Marugoto PDFs cached, but pdftotext or all three files are unavailable; keeping them provenance-only for this run.")
    merge_args = [
        "--staged",
        str(staged_openjlpt[0].relative_to(ROOT)),
        *extras,
        "--source-manifest",
        str(cache_dir / "manifest.json"),
        "--output",
        f"data/staging/kizashi-{level}-source-review.json",
    ]
    merge_args.extend(sum((["--extra", str(path.relative_to(ROOT))] for path in staged_openjlpt[1:]), []))
    run(
        "merge_openjlpt_staging.py",
        *merge_args,
    )
    run("report_phase1_staging.py", "--input", f"data/staging/kizashi-{level}-source-review.json")
    print("Staging complete. Non-rejected records are learner-released and can be rendered with render_supabase_content_sql.py.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
