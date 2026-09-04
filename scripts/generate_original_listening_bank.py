#!/usr/bin/env python3
"""Generate static Kizashi-authored listening scenarios.

The scripts are deliberately deterministic and store no audio. The existing
BrowserSpeechProvider reads the transcript when a learner presses Play.
"""

from __future__ import annotations

import json
import argparse
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "original-listening-bank.json"
FAMILIES = ("task-based response", "key point", "verbal expression", "quick response")
FAMILY_COUNTS = {"task-based response": 20, "key point": 20, "verbal expression": 15, "quick response": 25}

VISUAL_SCENES = {
    "station": ("station", "A traveler is speaking with station staff at a ticket counter."),
    "cafe": ("counter", "A customer is speaking with a café server at the counter."),
    "school": ("room", "A student is speaking with a teacher in a classroom."),
    "home": ("home", "A family member is speaking near the entrance of a home."),
    "shopping": ("shop", "A customer is speaking with staff in a shop."),
    "people": ("meeting", "Two people are meeting and choosing what to say."),
    "health": ("clinic", "A patient is speaking with staff at a clinic."),
    "transport": ("directions", "A traveler is asking for help near local transport."),
    "study": ("library", "A learner is speaking with staff in a quiet library."),
    "food": ("restaurant", "A customer is speaking with restaurant staff."),
    "errands": ("counter", "A customer is speaking with staff at a service counter."),
    "weather": ("meeting", "Two people are speaking outside while preparing for the weather."),
    "family": ("meal", "Family members are speaking together before a meal."),
    "hobby": ("event", "Two friends are speaking while making plans for an activity."),
    "travel": ("travel", "A traveler is speaking with staff while making travel plans."),
    "routine": ("home", "Someone is speaking about a normal daily routine."),
    "administration": ("counter", "A visitor is speaking with staff at a public service counter."),
    "work": ("work", "Two coworkers are speaking in a workplace."),
    "community": ("meeting", "A visitor is speaking with staff at a community event."),
}


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
    ("銀行", "口座", "午後三時", "職員", "errands", "口座を確認して"),
    ("薬局", "風邪の薬", "食後", "薬剤師", "health", "薬を買って"),
    ("駅前", "自転車", "駐輪場", "係員", "transport", "自転車を止めて"),
    ("八百屋", "りんご", "五個", "店員", "shopping", "りんごを選んで"),
    ("公民館", "料理教室", "土曜日", "受付", "community", "申し込んで"),
]

N4_SCENARIOS = [
    ("市役所", "住所変更", "来週の火曜日", "担当者", "administration", "住所変更の手続きをして"),
    ("会社", "会議資料", "午後三時", "同僚", "work", "会議資料を印刷して"),
    ("薬局", "薬", "食事のあと", "薬剤師", "health", "薬を飲んで"),
    ("駅", "乗り換え", "四番線", "駅員", "transport", "四番線へ移動して"),
    ("市民センター", "料理教室", "毎週土曜日", "受付", "community", "料理教室をお願いします"),
    ("料理教室", "野菜", "最初に", "先生", "food", "野菜を切って"),
    ("アパート", "水道", "明日の午前", "管理会社", "home", "水道の修理を頼んで"),
    ("旅行会社", "ホテル", "二泊", "係員", "travel", "ホテルを予約して"),
    ("病院", "検査", "午後二時半", "医者", "health", "検査を受けて"),
    ("スーパー", "割引券", "今月末まで", "店員", "shopping", "割引券を使って"),
    ("学校", "発表", "金曜日", "クラスメート", "school", "発表を準備して"),
    ("公園", "花", "雨が降る前", "隣人", "community", "花を植えて"),
    ("宅配便の営業所", "再配達", "土曜日の午後", "配達員", "errands", "荷物を受け取って"),
    ("会社", "昼休み", "一時間", "上司", "work", "一時間休んで"),
    ("映画館", "上映時間", "午後八時", "友達", "hobby", "映画を見て"),
    ("町のセンター", "日本語教室", "水曜日の夜", "受付", "study", "教室に参加して"),
    ("家", "掃除", "客が来る前", "姉", "home", "部屋を片付けて"),
    ("電車", "遅れ", "雨のため", "車掌", "transport", "電車を待って"),
    ("レストラン", "窓側の席", "七時半", "店員", "food", "席を予約して"),
    ("市民プール", "利用時間", "水曜日以外", "受付", "routine", "プールで泳いで"),
    ("市役所", "証明書", "平日の午後", "職員", "administration", "申請書を書いて"),
    ("会社", "出張", "来月の三日", "上司", "work", "予定を確認して"),
    ("病院", "診察券", "受付の前", "看護師", "health", "診察券を出して"),
    ("駅", "定期券", "来週まで", "駅員", "transport", "定期券を更新して"),
    ("地域センター", "講演会", "午後六時", "受付", "community", "講演会に参加して"),
]


def make_question(family: str, place: str, object_: str, detail: str, actor: str, action: str, level: str, variation: int = 0) -> tuple[str, list[str], int, str]:
    if family == "task-based response":
        if variation == 1:
            return (
                f"{place}で、次に何をしたらいいですか。",
                [f"{action}。", f"{place}を閉める。", "友達に電話する。", "何もしない。"],
                0,
                f"{action}。",
            )
        if variation == 2:
            return (
                "話を聞いて、先にすることは何ですか。",
                [f"{action}。", f"{place}へ帰る。", "新しい店を探す。", "まだ決めない。"],
                0,
                f"{action}。",
            )
        return (
            f"話を聞いて、次に何をしますか。",
            [f"{action}ください。", f"{place}へ帰る。", "友達に電話する。", "何もしない。"],
            0,
            f"{action}ください。",
        )
    if family == "key point":
        if variation == 1:
            return (
                "この話で確認したいことは何ですか。",
                [f"{object_}についての情報。", "明日の天気だけ。", "新しい店の場所。", "電車の運休。"],
                0,
                f"{object_}についての情報。",
            )
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


def transcript(family: str, place: str, object_: str, detail: str, actor: str, action: str, level: str, variation: int = 0) -> str:
    if level == "N4":
        action_phrase = action if action.endswith("お願いします") else f"{action}ください"
        if family == "verbal expression":
            return f"A：{actor}に{object_}をお願いしたいのですが、何と言えばいいですか。\nB：{place}では「{object_}をお願いします」と伝えてください。ただ、予定が変わった場合は先に知らせてください。\nA：分かりました。そう伝えます。\nB：はい、お願いします。"
        if family == "task-based response":
            return f"A：{place}では、何をしたらいいですか。\nB：予定では{detail}ですが、まず{action_phrase}。終わったら教えてください。\nA：はい、そのあと{object_}を確認します。\nB：では、そうしてください。"
        if family == "key point":
            return f"A：{place}の{object_}について確認したいです。\nB：{object_}は{detail}です。ただ、予定が変わった場合は先に知らせてください。\nA：分かりました。それを覚えておきます。\nB：はい、お願いします。"
        if family == "quick response":
            return f"A：{place}の{object_}について聞きたいです。\nB：{detail}です。もし予定が変わったら、先に確認してください。\nA：では、そのことを覚えておきます。\nB：分かりました。"
        if variation == 1:
            return f"A：{place}の{object_}について確認したいです。\nB：{detail}なので、先に{action_phrase}。\nA：分かりました。それが終わったら、もう一度確認します。\nB：はい、お願いします。"
        return f"A：{place}について相談があります。\nB：予定では{detail}ですが、まず{action_phrase}。\nA：では、そうします。そのあと{object_}を確認します。\nB：分かりました。"
    if family == "task-based response":
        if variation == 1:
            return f"A：すみません、{place}で何をしたらいいですか。\nB：{action}。\nA：分かりました。そうします。"
        if variation == 2:
            return f"A：{place}では、先に何をしますか。\nB：{action}。\nA：はい、先にそれをします。"
        return f"A：すみません、{place}では何をすればいいですか。\nB：まず{action}ください。\nA：はい、分かりました。"
    if family == "key point":
        if variation == 1:
            return f"A：{place}について教えてください。\nB：{object_}のことですね。{detail}です。\nA：分かりました。"
        return f"A：{place}について聞きました。\nB：はい、{object_}は{detail}です。\nA：そうですか。ありがとうございます。"
    if family == "verbal expression":
        if variation == 1:
            return f"A：{place}で、どう言えばいいですか。\nB：{object_}をお願いします。\nA：ありがとうございます。"
        return f"A：{place}で何と言いますか。\nB：{object_}をお願いします。\nA：はい、どうぞ。"
    if variation == 1:
        return f"A：{place}のことを覚えておきたいです。\nB：{object_}は{detail}です。\nA：はい、覚えておきます。"
    return f"A：{place}について教えてください。\nB：{object_}は{detail}です。\nA：分かりました。"


def visual_context(tag: str, place: str) -> tuple[str, str]:
    return VISUAL_SCENES.get(tag, ("meeting", f"Two people are speaking in a {place} setting."))


def listening(level: str, family: str, number: int, values: tuple[str, str, str, str, str, str], constraints: dict[str, object] | None = None, variation: int = 0) -> dict:
    place, object_, detail, actor, tag, action = values
    prompt, answers, correct, explanation = make_question(family, place, object_, detail, actor, action, level, variation)
    scene, description = visual_context(tag, place)
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
        "transcript": transcript(family, place, object_, detail, actor, action, level, variation),
        "questions": [{"prompt": prompt, "answers": answers, "correctAnswer": correct, "questionType": family, "explanation": explanation, **({"visualScene": scene, "visualContext": description} if family == "verbal expression" else {})}],
        "generationConstraints": constraints or {"numberOfSpeakers": 2},
    }


def build(levels: list[str] | None = None, families: list[str] | None = None, situations: list[str] | None = None, target_vocabulary: list[str] | None = None, forbidden_contexts: list[str] | None = None, constraints: dict[str, object] | None = None) -> dict:
    items = []
    lessons = []
    selected_levels = levels or ["N5", "N4"]
    selected_families = families or list(FAMILIES)
    selected_situations = {value.casefold() for value in (situations or [])}
    selected_vocabulary = {value.casefold() for value in (target_vocabulary or [])}
    forbidden = {value.casefold() for value in (forbidden_contexts or [])}
    for level, scenarios in (("N5", N5_SCENARIOS), ("N4", N4_SCENARIOS)):
        if level not in selected_levels:
            continue
        for family_index, family in enumerate(FAMILIES):
            if family not in selected_families:
                continue
            ids = []
            for scenario_index, values in enumerate(scenarios[:FAMILY_COUNTS[family]]):
                place, object_, _detail, _actor, tag, _action = values
                searchable = " ".join((place, object_, tag)).casefold()
                if selected_situations and not any(value in searchable for value in selected_situations):
                    continue
                if selected_vocabulary and not any(value in searchable for value in selected_vocabulary):
                    continue
                if forbidden and any(value in searchable for value in forbidden):
                    continue
                number = (family_index * len(scenarios)) + scenario_index + 1
                item = listening(level, family, number, values, constraints, (family_index + scenario_index + (1 if level == "N4" else 0)) % 3)
                items.append(item)
                ids.append(item["id"])
            if not ids:
                continue
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
    if not items:
        raise ValueError("The requested listening constraints matched no scenarios.")
    return {
        "course": {"chapters": [{"id": "chapter-original-listening", "slug": "original-listening", "title": "Original listening practice", "description": "Original listening scenarios calibrated to N5 and N4 families.", "region": "assessment", "lessons": lessons}]},
        "listening": items,
        "source": {"id": "michi-curated-n5-seed", "role": "Kizashi-authored assessment listening"},
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--level", action="append", choices=("N5", "N4"), dest="levels")
    parser.add_argument("--family", action="append", choices=FAMILIES)
    parser.add_argument("--situation", action="append")
    parser.add_argument("--number-of-speakers", type=int, choices=(1, 2), default=2)
    parser.add_argument("--target-grammar", action="append", default=[])
    parser.add_argument("--allowed-grammar", action="append", default=[])
    parser.add_argument("--target-vocabulary", action="append", default=[])
    parser.add_argument("--allowed-vocabulary", action="append", default=[])
    parser.add_argument("--unknown-word-budget", type=int, default=0)
    parser.add_argument("--desired-duration", type=int, default=30)
    parser.add_argument("--question")
    parser.add_argument("--answer-structure", default="four-choice")
    parser.add_argument("--forbidden-context", action="append", default=[])
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    constraints = {
        "targetLevel": args.levels or ["N5", "N4"],
        "families": args.family or list(FAMILIES),
        "situations": args.situation or [],
        "numberOfSpeakers": args.number_of_speakers,
        "targetGrammar": args.target_grammar,
        "allowedGrammar": args.allowed_grammar,
        "targetVocabulary": args.target_vocabulary,
        "allowedVocabulary": args.allowed_vocabulary,
        "unknownWordBudget": args.unknown_word_budget,
        "desiredDurationSeconds": args.desired_duration,
        "question": args.question,
        "answerStructure": args.answer_structure,
        "forbiddenContexts": args.forbidden_context,
    }
    payload = build(args.levels, args.family, args.situation, args.target_vocabulary, args.forbidden_context, constraints)
    output = args.output if args.output.is_absolute() else ROOT / args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    from collections import Counter
    print("Generated", output if output.is_absolute() and ROOT not in output.parents else output.relative_to(ROOT), Counter((item["jlptLevel"], item["subcategory"]) for item in payload["listening"]))


if __name__ == "__main__":
    main()
