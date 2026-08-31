#!/usr/bin/env python3
"""Cache Aozora's published UTF-8 catalog as reviewable metadata."""

import argparse
import csv
import hashlib
import io
import json
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path


CATALOG_URL = "https://www.aozora.gr.jp/index_pages/list_person_all_utf8.zip"
AOZORA_ORIGIN = "https://www.aozora.gr.jp"


def rights_status(marker: str) -> str:
    if any(token in marker.lower() for token in ("著作権存続", "保護", "protected", "copyright reserved", "作業中")):
        return "protected"
    if any(token in marker.lower() for token in ("著作権消滅", "public domain", "expired", "reusable")):
        return "public-domain"
    return "unknown"


def rights_marker(row: dict[str, str]) -> str:
    values = [
        value.strip()
        for key, value in row.items()
        if any(token in key.lower() for token in ("権利", "著作権", "copyright", "rights", "備考", "remarks", "note")) and value
    ]
    status = (row.get("状態") or row.get("status") or "").strip()
    if status and any(token in status.lower() for token in ("著作権", "copyright", "rights", "protected", "public domain", "expired", "reusable")):
        values.append(status)
    return " ".join(values) or status


def url_for(value: str) -> str | None:
    value = value.strip()
    if not value:
        return None
    if value.startswith("https://"):
        return value
    if value.startswith("/"):
        return f"{AOZORA_ORIGIN}{value}"
    return None


def parse_catalog(raw: str) -> list[dict[str, str | None]]:
    rows = csv.DictReader(io.StringIO(raw))
    works = []
    for row in rows:
        work_id = (row.get("作品ID") or row.get("workId") or "").strip()
        person_id = (row.get("人物ID") or row.get("personId") or "").strip()
        title = (row.get("作品名") or row.get("title") or "").strip()
        if not work_id or not person_id or not title:
            continue
        marker = rights_marker(row)
        card_url = url_for(row.get("カードURL", "")) or f"{AOZORA_ORIGIN}/cards/{person_id.zfill(6)}/card{work_id}.html"
        text_url = url_for(row.get("テキストURL", "") or row.get("textUrl", ""))
        works.append({
            "workId": work_id,
            "personId": person_id,
            "title": title,
            "author": (row.get("著者名") or row.get("作者名") or row.get("author") or "").strip(),
            "cardUrl": card_url,
            "textUrl": text_url,
            "orthography": (row.get("文字遣い") or row.get("仮名遣い") or row.get("orthography") or "").strip() or None,
            "rightsMarker": marker,
            "rightsStatus": rights_status(marker),
        })
    return works


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache-dir", default="data/source-cache/aozora")
    parser.add_argument("--refresh", action="store_true")
    args = parser.parse_args()
    cache_dir = Path(args.cache_dir)
    cache_dir.mkdir(parents=True, exist_ok=True)
    archive_path = cache_dir / "list_person_all_utf8.zip"
    if args.refresh or not archive_path.exists():
        with urllib.request.urlopen(CATALOG_URL, timeout=30) as response:
            archive_path.write_bytes(response.read())
    archive_bytes = archive_path.read_bytes()
    with zipfile.ZipFile(io.BytesIO(archive_bytes)) as archive:
        csv_name = next(name for name in archive.namelist() if name.lower().endswith(".csv"))
        raw = archive.read(csv_name).decode("utf-8-sig")
    payload = {
        "source": CATALOG_URL,
        "retrievedAt": datetime.now(timezone.utc).isoformat(),
        "sha256": hashlib.sha256(archive_bytes).hexdigest(),
        "filename": csv_name,
        "works": parse_catalog(raw),
    }
    (cache_dir / "catalog.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"works": len(payload["works"]), "cache": str(cache_dir / "catalog.json"), "sha256": payload["sha256"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
