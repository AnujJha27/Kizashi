#!/usr/bin/env python3
"""Generate static Kizashi-authored listening scenarios.

The scripts are deliberately deterministic and store no audio. The existing
BrowserSpeechProvider reads the transcript when a learner presses Play.
"""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "original-listening-bank.json"
FAMILIES = ("task-based response", "key point", "verbal expression", "quick response")


N5_SCENARIOS = [
    ("駅", "切符", "三番線", "駅員", "station", "切符を買って"),
    ("喫茶店", "お茶", "三百円", "店員", "cafe", "お茶を注文して"),
    ("教室", "本", "机の上", "先生", "school", "本を読んで"),
    ("家", "鍵", "玄関", "母", "home", "鍵を取って"),
    ("スーパー", "牛乳", "二本", "店員", "shopping", "牛乳を二本買って"),
    ("公園", "友達", "午後二時", "友達", "people", "友達を待って"),
    ("病院", "予約", "午前十時", "受付", "health", "予約を確認して"),
    ("バス停", "バス", "学校の右", "運転手", "transport", "バスに乗って"),
    ("図書館", "本", "来週の月曜日", "図書館の人", "study", "本を返して"),
    ("レストラン", "水", "テーブルの上", "店員", "food", "水を飲んで"),
    ("郵便局", "荷物", "明日の朝", "職員", "errands", "荷物を送って"),
    ("服の店", "赤いシャツ", "二千円", "店員", "shopping", "シャツを買って"),
    ("駅の出口", "傘", "西口", "友達", "weather", "傘を持って"),
    ("学校", "宿題", "今日の夜", "学生", "school", "宿題をして"),
    ("ホテル", "部屋", "二階", "受付", "travel", "受付で手続きをして"),
    ("電話", "先生", "午後五時", "友達", "communication", "先生と話して"),
    ("家族の食事", "魚", "日曜日", "父", "family", "魚を食べて"),
    ("映画館", "映画", "七時", "友達", "hobby", "映画を見て"),
    ("京都", "お寺", "来週", "家族", "travel", "お寺へ行って"),
    ("カレンダー", "日曜日", "休み", "田中さん", "routine", "休んで"),
]

N4_SCENARIOS = [
    ("市役所", "住所変更", "来週の火曜日", "担当者", "administration", "住所変更の手続きをして"),
    ("会社", "会議資料", "午後三時", "同僚", "work", "会議資料を印刷して"),
    ("薬局", "薬", "食事のあと", "薬剤師", "health", "薬を飲んで"),
    ("駅", "乗り換え", "四番線", "駅員", "transport", "四番線へ移動して"),
    ("図書館", "新聞", "毎週土曜日", "司書", "study", "新聞を読んで"),
    ("料理教室", "野菜", "最初に", "先生", "food", "野菜を切って"),
    ("アパート", "水道", "明日の午前", "管理会社", "home", "水道の修理を頼んで"),
    ("旅行会社", "ホテル", "二泊", "係員", "travel", "ホテルを予約して"),
    ("病院", "検査", "午後二時半", "医者", "health", "検査を受けて"),
    ("スーパー", "割引券", "今月末まで", "店員", "shopping", "割引券を使って"),
    ("学校", "発表", "金曜日", "クラスメート", "school", "発表を準備して"),
    ("公園", "花", "雨が降る前", "隣人", "community", "花を植えて"),
    ("郵便局", "再配達", "土曜日の午後", "配達員", "errands", "荷物を受け取って"),
    ("会社", "昼休み", "一時間", "上司", "work", "一時間休んで"),
    ("映画館", "上映時間", "午後八時", "友達", "hobby", "映画を見て"),
    ("町のセンター", "日本語教室", "水曜日の夜", "受付", "study", "教室に参加して"),
    ("家", "掃除", "客が来る前", "姉", "home", "部屋を片付けて"),
    ("電車", "遅れ", "雨のため", "車掌", "transport", "電車を待って"),
    ("レストラン", "窓側の席", "七時半", "店員", "food", "席を予約して"),
    ("市民プール", "利用時間", "水曜日以外", "受付", "routine", "プールで泳いで"),
]


def make_question(family: str, place: str, object_: str, detail: str, actor: str, action: str, level: str) -> tuple[str, list[str], int, str]:
    if family == "task-based response":
        return (
            f"話を聞いて、次に何をしますか。",
            [f"{action}ください。", f"{place}へ帰る。", "友達に電話する。", "何もしない。"],
            0,
            f"{action}ください。",
        )
    if family == "key point":
        return (
            f"話の大切な点は何ですか。",
            [f"{place}で{object_}について話している。", "明日は休みになる。", "新しい店ができる。", "電車がありません。"],
            0,
            f"{place}で{object_}について話している。",
        )
    if family == "verbal expression":
        return (
            "この場面で、自然な表現はどれですか。",
            [f"{object_}をお願いします。", "分かりませんでした。", "おやすみなさい。", "いただきません。"],
            0,
            f"{object_}をお願いします。",
        )
    return (
        "話を聞いて、何について覚えておく必要がありますか。",
        [detail, "朝六時", "来月の水曜日", "まだ分かりません"],
        0,
        detail,
    )


def transcript(family: str, place: str, object_: str, detail: str, actor: str, action: str, level: str) -> str:
    if family == "task-based response":
        return f"A：すみません、{place}では何をすればいいですか。\nB：まず{action}ください。\nA：はい、分かりました。"
    if family == "key point":
        return f"A：{place}について聞きました。\nB：はい、{object_}は{detail}です。\nA：そうですか。ありがとうございます。"
    if family == "verbal expression":
        return f"A：{place}で何と言いますか。\nB：{object_}をお願いします。\nA：はい、どうぞ。"
    return f"A：{place}について教えてください。\nB：{object_}は{detail}です。\nA：分かりました。"


def listening(level: str, family: str, number: int, values: tuple[str, str, str, str, str, str]) -> dict:
    place, object_, detail, actor, tag, action = values
    prompt, answers, correct, explanation = make_question(family, place, object_, detail, actor, action, level)
    difficulty = 2 if level == "N5" else 4
    grammar = ["grammar-wa", "grammar-masu", "grammar-ni"] if level == "N5" else ["grammar-wa", "grammar-te-form", "grammar-toki"]
    return {
        "id": f"assessment-listening-{level.lower()}-{number:02d}",
        "slug": f"assessment-listening-{level.lower()}-{number:02d}",
        "title": f"{place} · {object_}",
        "jlptLevel": level,
        "category": "listening",
        "subcategory": family,
        "difficulty": difficulty,
        "prerequisiteIds": grammar[:2],
        "tags": ["assessment", "original", f"{level.lower()}-listening", tag],
        "sourceIds": ["michi-curated-n5-seed"],
        "situation": f"A {level} learner hears a short exchange about {tag}.",
        "audioUrl": None,
        "voice": "ja-JP BrowserSpeechProvider",
        "speed": 0.86 if level == "N5" else 0.82,
        "sourceType": "tts",
        "transcript": transcript(family, place, object_, detail, actor, action, level),
        "questions": [{"prompt": prompt, "answers": answers, "correctAnswer": correct, "questionType": family, "explanation": explanation}],
    }


def build() -> dict:
    items = []
    lessons = []
    for level, scenarios in (("N5", N5_SCENARIOS), ("N4", N4_SCENARIOS)):
        for family_index, family in enumerate(FAMILIES):
            ids = []
            for scenario_index, values in enumerate(scenarios):
                number = (family_index * len(scenarios)) + scenario_index + 1
                item = listening(level, family, number, values)
                items.append(item)
                ids.append(item["id"])
            slug = f"original-{level.lower()}-{family_index + 1}"
            lessons.append({
                "id": f"lesson-{slug}",
                "slug": slug,
                "title": f"{level} {family}",
                "subtitle": "Original listening scenarios",
                "description": f"Practice the {family} listening family with original {level} exchanges.",
                "estimatedMinutes": 25,
                "itemIds": ids,
            })
    return {
        "course": {"chapters": [{"id": "chapter-original-listening", "slug": "original-listening", "title": "Original listening practice", "description": "Original listening scenarios calibrated to N5 and N4 families.", "region": "assessment", "lessons": lessons}]},
        "listening": items,
        "source": {"id": "michi-curated-n5-seed", "role": "Kizashi-authored assessment listening"},
    }


def main() -> None:
    payload = build()
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    from collections import Counter
    print("Generated", OUTPUT.relative_to(ROOT), Counter((item["jlptLevel"], item["subcategory"]) for item in payload["listening"]))


if __name__ == "__main__":
    main()
