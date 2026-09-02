#!/usr/bin/env python3
"""Generate Kizashi-authored reading practice from deterministic templates.

The output is static curriculum content. It is intentionally separate from
source-review staging so imported records cannot silently become assessments.
"""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "original-reading-bank.json"


def question(prompt: str, options: list[str], correct: int, question_type: str) -> dict:
    return {
        "prompt": prompt,
        "options": options,
        "correctAnswer": correct,
        "questionType": question_type,
        "explanation": options[correct],
    }


def reading(level: str, family: str, number: int, title: str, passage: str, translation: str, q: dict, tags: list[str]) -> dict:
    prefix = level.lower()
    difficulty = 2 if level == "N5" else 4
    grammar = ["grammar-wa", "grammar-masu", "grammar-ni"] if level == "N5" else ["grammar-wa", "grammar-te-form", "grammar-ta-form", "grammar-toki"]
    kanji = ["kanji-hi", "kanji-ji", "kanji-gaku"] if level == "N5" else ["kanji-kyou", "kanji-go-noon", "kanji-shitsu"]
    return {
        "id": f"assessment-reading-{prefix}-{family}-{number:02d}",
        "slug": f"assessment-reading-{prefix}-{family}-{number:02d}",
        "title": title,
        "jlptLevel": level,
        "category": "reading",
        "subcategory": family,
        "difficulty": difficulty,
        "prerequisiteIds": grammar[:2],
        "tags": ["assessment", "original", f"{prefix}-reading", *tags],
        "sourceIds": ["michi-curated-n5-seed"],
        "passage": passage,
        "translation": translation,
        "vocabularyIds": ["vocab-mainichi", "vocab-hon", "vocab-eki", "vocab-benkyou"],
        "grammarIds": grammar,
        "kanjiIds": kanji,
        "estimatedDifficulty": difficulty,
        "questions": [q],
    }


def short_rows(level: str, rows: list[tuple[str, str, str, str, str, list[str], int, str]]) -> list[dict]:
    result = []
    for number, (slug, title, passage, translation, prompt, options, correct, tag) in enumerate(rows, 1):
        result.append(reading(level, "short", number, title, passage, translation, question(prompt, options, correct, "short passage detail"), [slug, tag]))
    return result


def mid_rows(level: str, rows: list[tuple[str, str, str, str, str, list[str], int, str]]) -> list[dict]:
    result = []
    for number, (slug, title, passage, translation, prompt, options, correct, tag) in enumerate(rows, 1):
        result.append(reading(level, "mid", number, title, passage, translation, question(prompt, options, correct, "mid-length passage"), [slug, tag]))
    return result


def retrieval_rows(level: str, rows: list[tuple[str, str, str, str, str, list[str], int, str]]) -> list[dict]:
    result = []
    for number, (slug, title, passage, translation, prompt, options, correct, tag) in enumerate(rows, 1):
        result.append(reading(level, "information-retrieval", number, title, passage, translation, question(prompt, options, correct, "information retrieval"), [slug, tag]))
    return result


N5_SHORT = [
    ("class-note", "教室の予定", "月曜日、田中さんは九時に教室で日本語を勉強します。", "On Monday, Tanaka studies Japanese in the classroom at nine.", "月曜日、何をしますか。", ["日本語を勉強します", "映画を見ます", "買い物をします", "病院へ行きます"], 0, "school"),
    ("morning-message", "朝のメモ", "母は毎朝六時に起きます。朝ご飯のあとで、駅へ行きます。", "Mother gets up at six every morning. After breakfast, she goes to the station.", "母は何時に起きますか。", ["五時", "六時", "七時", "八時"], 1, "routine"),
    ("library-card", "図書館のカード", "図書館でカードを作りました。カードは机の上にあります。", "I made a library card. The card is on the desk.", "カードはどこですか。", ["駅の前", "机の上", "学校の下", "店の中"], 1, "study"),
    ("rain-coat", "雨の日", "今日は雨です。山田さんは傘を持って、学校へ行きます。", "It is raining today. Yamada takes an umbrella and goes to school.", "山田さんは何を持ちますか。", ["本", "傘", "切符", "写真"], 1, "weather"),
    ("lunch-box", "昼ご飯", "昼は家でご飯を食べます。午後は友達と公園へ行きます。", "I eat lunch at home. In the afternoon, I go to the park with a friend.", "昼、どこでご飯を食べますか。", ["家", "公園", "駅", "大学"], 0, "food"),
    ("new-shoes", "新しい靴", "新しい靴は店の前にあります。黒い靴を買いました。", "The new shoes are in front of the shop. I bought black shoes.", "何色の靴を買いましたか。", ["白", "赤", "黒", "青"], 2, "shopping"),
    ("train-ticket", "切符", "駅で切符を買います。電車は三番線から出ます。", "I buy a ticket at the station. The train leaves from platform three.", "電車は何番線ですか。", ["一番線", "二番線", "三番線", "四番線"], 2, "transport"),
    ("club-room", "クラブの部屋", "水曜日の午後、学生はクラブの部屋で歌を練習します。", "On Wednesday afternoon, the students practice singing in the club room.", "学生はどこで歌を練習しますか。", ["教室", "クラブの部屋", "図書館", "家"], 1, "school"),
    ("family-photo", "家族の写真", "この写真に父と母と妹がいます。弟は写真を撮りました。", "This picture has my father, mother, and younger sister. My younger brother took it.", "だれが写真を撮りましたか。", ["父", "母", "妹", "弟"], 3, "family"),
    ("evening-walk", "夕方の散歩", "夕方、私は犬と川の近くを歩きます。七時に家へ帰ります。", "In the evening, I walk near the river with my dog. I return home at seven.", "だれと歩きますか。", ["友達", "犬", "先生", "家族"], 1, "routine"),
    ("doctor-note", "病院のメモ", "頭が痛いので、木曜日に病院へ行きます。予約は十時です。", "Because I have a headache, I go to the hospital on Thursday. The appointment is at ten.", "予約は何時ですか。", ["八時", "九時", "十時", "十一時"], 2, "health"),
    ("birthday-card", "誕生日カード", "友達の誕生日です。私は小さいカードを書いて、郵便で送りました。", "It is my friend's birthday. I wrote a small card and mailed it.", "何を送りましたか。", ["本", "カード", "花", "写真"], 1, "people"),
    ("bus-stop", "バス停", "バス停は学校の右です。八時のバスに乗って会社へ行きます。", "The bus stop is to the right of the school. I take the eight o'clock bus to work.", "バス停はどこですか。", ["学校の左", "学校の右", "駅の中", "家の上"], 1, "transport"),
    ("desk-cleaning", "机の掃除", "土曜日に部屋を掃除します。本は本棚へ、かばんは椅子の下へ置きます。", "On Saturday I clean my room. I put the books on the bookshelf and the bag under the chair.", "かばんはどこへ置きますか。", ["机の上", "本棚", "椅子の下", "部屋の外"], 2, "home"),
    ("music-class", "音楽の授業", "金曜日は音楽の授業があります。授業のあとで、学生は先生と話します。", "There is music class on Friday. After class, the students talk with the teacher.", "いつ音楽の授業がありますか。", ["月曜日", "水曜日", "金曜日", "日曜日"], 2, "school"),
    ("market-list", "買い物リスト", "店へ行く前に、母は牛乳とパンのリストを書きました。", "Before going to the shop, Mother wrote a list of milk and bread.", "リストに何がありますか。", ["魚と水", "牛乳とパン", "本と傘", "靴と服"], 1, "shopping"),
    ("park-bench", "公園のベンチ", "公園にはベンチが三つあります。子どもたちは真ん中のベンチに座ります。", "There are three benches in the park. The children sit on the middle bench.", "子どもたちはどのベンチに座りますか。", ["右", "左", "真ん中", "外"], 2, "places"),
    ("office-hours", "事務室", "事務室は朝八時から午後五時までです。昼は十二時から一時まで休みます。", "The office is open from eight in the morning to five in the afternoon. It closes for lunch from twelve to one.", "事務室は何時までですか。", ["一時", "三時", "五時", "八時"], 2, "information"),
    ("summer-plan", "夏の予定", "夏休みに海へ行きます。海で泳いで、夜はホテルで休みます。", "I go to the sea during summer vacation. I swim and rest at a hotel at night.", "夏休みにどこへ行きますか。", ["山", "海", "学校", "病院"], 1, "travel"),
    ("phone-call", "電話", "今、鈴木さんに電話をします。鈴木さんは午後三時に家へ帰ります。", "I am calling Suzuki now. Suzuki returns home at three in the afternoon.", "鈴木さんは何時に帰りますか。", ["一時", "二時", "三時", "四時"], 2, "communication"),
    ("house-key", "家の鍵", "鍵は玄関の小さい箱の中です。出かける前に鍵を取ってください。", "The key is in the small box at the entrance. Please take it before going out.", "鍵はどこですか。", ["箱の中", "机の下", "駅の前", "店の右"], 0, "home"),
    ("class-photo", "クラス写真", "クラス写真は来週の火曜日です。学生は午前十時に学校へ来ます。", "The class photo is next Tuesday. Students come to school at ten in the morning.", "学生は何時に来ますか。", ["午前九時", "午前十時", "午後一時", "午後三時"], 1, "school"),
    ("night-book", "夜の本", "寝る前に本を少し読みます。十一時に電気を消して、寝ます。", "Before bed I read a little. At eleven I turn off the light and sleep.", "何時に寝ますか。", ["九時", "十時", "十一時", "十二時"], 2, "routine"),
    ("flower-shop", "花屋", "花屋は駅の近くです。母のために赤い花を三本買いました。", "The flower shop is near the station. I bought three red flowers for my mother.", "何本の花を買いましたか。", ["一本", "二本", "三本", "四本"], 2, "shopping"),
    ("lost-umbrella", "忘れた傘", "電車に傘を忘れました。駅の人に聞くと、傘は受付にありました。", "I left my umbrella on the train. When I asked a station worker, it was at the reception desk.", "傘はどこにありましたか。", ["電車の中", "受付", "学校", "店"], 1, "transport"),
    ("morning-bus", "朝のバス", "朝はバスで駅へ行きます。今日は道が混んでいたので、いつもより十分遅く着きました。", "I take the bus to the station in the morning. Today the roads were busy, so I arrived ten minutes later than usual.", "今日はいつもよりどうなりましたか。", ["早く着きました", "遅く着きました", "歩いて帰りました", "駅へ行きませんでした"], 1, "transport"),
]

N5_MID = [
    ("weekday-diary", "平日の一日", "私は毎朝七時に起きます。朝ご飯を食べて、八時に学校へ行きます。午後は図書館で本を読み、夜は家で宿題をします。", "I get up at seven every morning. I eat breakfast and go to school at eight. In the afternoon I read at the library, and at night I do homework at home.", "午後、どこで本を読みますか。", ["学校", "図書館", "駅", "家"], 1, "routine"),
    ("friend-visit", "友達の家", "日曜日、友達の家へ行きました。駅で会って、一緒にパンを買いました。友達の家では音楽を聞きながら話しました。", "On Sunday I went to my friend's house. We met at the station and bought bread together. At the house we talked while listening to music.", "二人はどこで会いましたか。", ["駅", "学校", "店", "公園"], 0, "people"),
    ("school-festival", "学校のお祭り", "土曜日に学校のお祭りがあります。午前は歌を聞き、午後は食べ物を買います。雨のときは教室で映画を見ます。", "There is a school festival on Saturday. In the morning we listen to songs, and in the afternoon we buy food. If it rains, we watch a movie in the classroom.", "雨のとき、どこで映画を見ますか。", ["体育館", "教室", "駅", "家"], 1, "school"),
    ("train-trip", "電車の旅行", "来週、家族と京都へ行きます。朝の電車に乗るので、駅へ早く行きます。京都でお寺を見て、夕方に帰ります。", "Next week I am going to Kyoto with my family. We take a morning train, so we go to the station early. We see a temple in Kyoto and return in the evening.", "だれと京都へ行きますか。", ["友達", "先生", "家族", "一人"], 2, "travel"),
    ("part-time-shift", "アルバイトの予定", "月曜日と水曜日は店で働きます。仕事は午後六時から九時までです。金曜日は働かないで、家で休みます。", "I work at a shop on Monday and Wednesday. Work is from six to nine in the evening. On Friday I do not work and rest at home.", "何曜日に店で働きますか。", ["月曜日と水曜日", "火曜日と木曜日", "金曜日", "土曜日と日曜日"], 0, "work"),
    ("healthy-breakfast", "朝ご飯", "毎朝、私はご飯と魚を食べます。忙しい日はパンだけですが、水を飲んでから学校へ行きます。", "Every morning I eat rice and fish. On busy days I only eat bread, but I drink water before going to school.", "忙しい日は何を食べますか。", ["魚だけ", "パンだけ", "ご飯と魚", "何も食べません"], 1, "food"),
    ("library-rule", "図書館のルール", "図書館では静かにしてください。本は一人三冊まで借りることができます。土曜日は午後四時に閉まります。", "Please be quiet in the library. You can borrow up to three books. On Saturday it closes at four in the afternoon.", "一人何冊まで借りることができますか。", ["一冊", "二冊", "三冊", "四冊"], 2, "study"),
    ("weather-change", "天気と予定", "朝は晴れていましたが、午後から雨になりました。公園へ行く予定をやめて、家で料理をしました。", "It was sunny in the morning, but it began raining in the afternoon. I cancelled the plan to go to the park and cooked at home.", "雨になって、何をしましたか。", ["公園へ行きました", "映画を見ました", "家で料理をしました", "駅へ行きました"], 2, "weather"),
    ("moving-room", "部屋の引っ越し", "新しい部屋は前の部屋より広いです。窓の近くに机を置き、本棚はドアの右に置きました。", "The new room is larger than the old one. I put the desk near the window and the bookshelf to the right of the door.", "本棚はどこですか。", ["窓の左", "ドアの右", "机の上", "部屋の外"], 1, "home"),
    ("concert-plan", "コンサート", "友達と土曜日のコンサートへ行きます。切符はもう買いました。コンサートのあとで駅の近くの店で晩ご飯を食べます。", "I am going to a Saturday concert with a friend. We have already bought tickets. After the concert we eat dinner at a shop near the station.", "切符はどうしましたか。", ["まだ買いません", "友達にあげました", "もう買いました", "駅でなくしました"], 2, "plans"),
    ("morning-appointment", "朝の予約", "明日は病院の予約があります。朝ご飯を食べたあとで、九時のバスに乗ります。病院では先生に頭の痛さを話します。", "Tomorrow I have a hospital appointment. After breakfast I take the nine o'clock bus. At the hospital I tell the doctor about my headache.", "何時のバスに乗りますか。", ["七時", "八時", "九時", "十時"], 2, "health"),
    ("shopping-gift", "プレゼント", "妹の誕生日に、駅の店で青いかばんを買いました。家へ帰って、カードを書いてかばんと一緒に包みました。", "For my younger sister's birthday, I bought a blue bag at a shop near the station. I went home, wrote a card, and wrapped it with the bag.", "何色のかばんですか。", ["赤", "青", "白", "黒"], 1, "shopping"),
    ("class-change", "授業の変更", "先生からメールが来ました。明日の日本語の授業は午前ではなく、午後二時から始まります。教室はいつもの部屋です。", "The teacher sent an email. Tomorrow's Japanese class starts at two in the afternoon instead of the morning. The classroom is the usual one.", "授業は何時からですか。", ["午前九時", "午後一時", "午後二時", "午後四時"], 2, "school"),
    ("weekend-cooking", "週末の料理", "土曜日に母と買い物をして、野菜と肉を買いました。家へ帰ったあとで、二人でカレーを作りました。", "On Saturday I shopped with my mother and bought vegetables and meat. After returning home, we made curry together.", "だれとカレーを作りましたか。", ["父", "母", "先生", "友達"], 1, "food"),
]

N5_RETRIEVAL = [
    ("pool-notice", "プールのお知らせ", "プールのお知らせ\n月曜日は休みです。火曜日から金曜日は午前十時から午後六時まで、土曜日と日曜日は午前九時から開いています。", "Pool notice: It is closed Monday. Tuesday through Friday it is open 10 a.m. to 6 p.m.; Saturday and Sunday it opens at 9 a.m.", "プールが休みの日はいつですか。", ["月曜日", "火曜日", "土曜日", "日曜日"], 0, "notice"),
    ("cafe-menu", "喫茶店のメニュー", "今日のメニュー\nコーヒー 300円\nお茶 250円\nサンドイッチ 500円\nケーキはありません。", "Today's menu: coffee 300 yen, tea 250 yen, sandwich 500 yen. There is no cake.", "一番安いものは何ですか。", ["コーヒー", "お茶", "サンドイッチ", "ケーキ"], 1, "menu"),
    ("bus-timetable", "バスの時刻", "駅行きバス\n朝：8:00、9:00、10:00\n午後：1:00、3:00、5:00\n駅まで二十分かかります。", "Bus to the station: morning 8, 9, 10; afternoon 1, 3, 5. It takes twenty minutes to the station.", "午後に何時のバスがありますか。", ["十二時", "一時", "二時", "四時"], 1, "timetable"),
    ("museum-hours", "美術館の時間", "美術館は水曜日から日曜日まで開いています。午前十時から午後五時までです。月曜日と火曜日は休みです。", "The museum is open Wednesday through Sunday, 10 a.m. to 5 p.m. It is closed Monday and Tuesday.", "美術館が開いている日はどれですか。", ["月曜日", "火曜日", "水曜日", "月曜日と火曜日"], 2, "notice"),
    ("class-timetable", "授業時間割", "月曜日：日本語、体育\n火曜日：数学、音楽\n水曜日：英語\n日本語の授業は朝一番です。", "Class schedule: Monday Japanese and PE; Tuesday math and music; Wednesday English. Japanese is the first class in the morning.", "火曜日に何の授業がありますか。", ["日本語と体育", "数学と音楽", "英語", "体育と英語"], 1, "schedule"),
    ("shop-sale", "店のセール", "春のセール\nシャツは20%安くなります。靴は半額です。セールは今週の日曜日までです。", "Spring sale: shirts are 20% off and shoes are half price. The sale runs through this Sunday.", "何が半額ですか。", ["シャツ", "靴", "かばん", "帽子"], 1, "sale"),
    ("clinic-sheet", "病院の受付", "受付時間\n午前：9:00〜12:00\n午後：2:00〜5:00\n水曜日の午後と日曜日は休みです。", "Reception hours: 9–12 a.m. and 2–5 p.m. Wednesday afternoon and Sunday are closed.", "水曜日の午後に受付へ行けますか。", ["はい、いつでも行けます", "いいえ、休みです", "午前だけです", "日曜日だけです"], 1, "notice"),
    ("library-event", "図書館のイベント", "子どもの本の会\n六月十日（土）午後二時\n場所：図書館二階\n参加したい人は一時半までに来てください。", "Children's book event: June 10 Saturday at 2 p.m., second floor of the library. Those attending should come by 1:30.", "何時までに来てくださいと言っていますか。", ["一時", "一時半", "二時", "二時半"], 1, "event"),
    ("train-map", "駅の案内", "駅の出口\n東口：バス、タクシー\n西口：公園、ホテル\n切符売り場は中央口の近くです。", "Station exits: east for buses and taxis; west for the park and hotel. The ticket office is near the central exit.", "ホテルへ行くにはどの出口ですか。", ["東口", "西口", "中央口", "出口はありません"], 1, "directions"),
]

N4_SHORT = [
    ("health-return", "病院の帰り", "病院で薬をもらったあと、駅まで歩きました。家に帰る前に薬局にも寄りました。", "After receiving medicine at the hospital, I walked to the station. Before going home I also stopped at a pharmacy.", "家に帰る前にどこへ寄りましたか。", ["薬局", "学校", "図書館", "公園"], 0, "health"),
    ("new-neighbor", "新しい隣人", "先月、隣に新しい家族が引っ越してきました。週末にお菓子を持って挨拶しました。", "Last month a new family moved next door. On the weekend I brought sweets and greeted them.", "何を持って挨拶しましたか。", ["花", "本", "お菓子", "傘"], 2, "people"),
    ("lost-wallet", "財布を探す", "財布が見つからなかったので、昨日行った店に電話しました。店員が預かっていました。", "Because I could not find my wallet, I called the shop I visited yesterday. The clerk had kept it.", "財布はどこにありましたか。", ["家", "店", "駅", "学校"], 1, "daily-life"),
    ("club-choice", "クラブを選ぶ", "私は写真クラブに入ることにしました。毎週木曜日に公園で写真を撮ります。", "I decided to join the photography club. Every Thursday we take photos in the park.", "いつ写真を撮りますか。", ["毎週月曜日", "毎週水曜日", "毎週木曜日", "毎週土曜日"], 2, "hobby"),
    ("bus-delay", "バスの遅れ", "雨のためバスが遅れました。駅に着いたとき、予定の電車はもう出たあとでした。", "The bus was late because of rain. When I arrived at the station, the scheduled train had already left.", "なぜバスが遅れましたか。", ["雪のため", "雨のため", "電車のため", "病気のため"], 1, "transport"),
    ("work-lunch", "仕事の昼休み", "昼休みは一時間あります。会社の近くの食堂で食べることもありますが、今日は弁当を持ってきました。", "There is a one-hour lunch break. I sometimes eat at a cafeteria near work, but today I brought a boxed lunch.", "今日は何を持ってきましたか。", ["本", "弁当", "傘", "切符"], 1, "work"),
    ("winter-clothes", "冬の服", "去年より今年の冬は寒くなりそうです。古いコートを出して、暖かい手袋も買いました。", "This winter looks likely to be colder than last year. I took out my old coat and bought warm gloves too.", "何を買いましたか。", ["コート", "靴", "手袋", "帽子"], 2, "weather"),
    ("study-method", "勉強の方法", "漢字を覚えるために、毎晩ノートに五回ずつ書いています。分からない漢字は先生に聞きます。", "To remember kanji, I write each one five times in a notebook every night. I ask the teacher about kanji I do not understand.", "漢字を何回ずつ書きますか。", ["二回", "三回", "五回", "十回"], 2, "study"),
    ("weekend-visit", "週末の訪問", "土曜日は祖母の家を訪ねる予定です。天気がよければ、自転車で行くつもりです。", "I plan to visit my grandmother's house on Saturday. If the weather is good, I intend to go by bicycle.", "天気がよければ、どうやって行きますか。", ["電車で", "バスで", "自転車で", "歩いて"], 2, "family"),
    ("cooking-class", "料理教室", "料理教室では、最初に先生が作り方を説明します。そのあと、学生が自分で野菜を切ります。", "In cooking class, the teacher first explains how to make the dish. After that, students cut vegetables themselves.", "最初に何をしますか。", ["野菜を食べます", "先生が説明します", "家へ帰ります", "買い物をします"], 1, "food"),
    ("phone-repair", "電話の修理", "電話が動かなくなったので、駅前の店に持っていきました。修理には三日かかるそうです。", "My phone stopped working, so I took it to a shop in front of the station. Apparently repairs will take three days.", "修理にどのくらいかかりますか。", ["一日", "二日", "三日", "一週間"], 2, "shopping"),
    ("morning-exercise", "朝の運動", "健康のために、朝起きたら十分ぐらい走ります。雨の日は家で体を動かすことにしています。", "For my health, I run for about ten minutes after waking up. On rainy days I make a point of exercising at home.", "雨の日はどこで運動しますか。", ["公園", "学校", "家", "会社"], 2, "health"),
    ("movie-choice", "映画を選ぶ", "二つの映画で迷いましたが、友達が面白いと言っていた映画を見ることにしました。", "I was unsure between two movies, but I decided to watch the one my friend said was interesting.", "どの映画を見ることにしましたか。", ["先生の映画", "友達が面白いと言った映画", "短い映画", "新しい映画"], 1, "hobby"),
    ("garden-work", "庭の仕事", "父が庭の木を切っている間に、私は花に水をやりました。仕事が終わったら一緒に昼ご飯を食べました。", "While my father was cutting trees in the garden, I watered the flowers. When the work was finished, we ate lunch together.", "私は何をしましたか。", ["木を切りました", "花に水をやりました", "昼ご飯を作りました", "買い物をしました"], 1, "home"),
    ("language-exchange", "言葉の交換", "日本語を練習するため、週に一度外国人の友達と話しています。私は日本語を教え、友達は英語を教えてくれます。", "To practice Japanese, I talk with a foreign friend once a week. I teach Japanese, and my friend teaches me English.", "私は何を教えますか。", ["英語", "日本語", "中国語", "数学"], 1, "communication"),
    ("hotel-checkin", "ホテルの受付", "ホテルに着くと、受付で名前を伝えてから部屋の鍵を受け取りました。部屋は三階でした。", "When I arrived at the hotel, I gave my name at reception and then received the room key. The room was on the third floor.", "どこで鍵を受け取りましたか。", ["駅", "受付", "部屋", "食堂"], 1, "travel"),
    ("recycling-day", "ごみの日", "この町では、燃えるごみは月曜日と木曜日に出します。びんと缶は水曜日なので、別の袋に入れておきます。", "In this town, burnable garbage is put out Monday and Thursday. Bottles and cans are Wednesday, so I put them in a separate bag.", "びんと缶はいつ出しますか。", ["月曜日", "火曜日", "水曜日", "木曜日"], 2, "home"),
    ("train-platform", "電車の乗り換え", "二番線の電車を降りたら、階段を上がって四番線へ行ってください。乗り換えには五分ほどかかります。", "After getting off the train at platform two, go up the stairs to platform four. The transfer takes about five minutes.", "次は何番線へ行きますか。", ["一番線", "二番線", "三番線", "四番線"], 3, "transport"),
    ("rainy-event", "雨の日のイベント", "屋外のイベントは雨で中止になりました。代わりに、市民センターの大きい部屋で発表会を行います。", "The outdoor event was cancelled due to rain. Instead, the presentation will be held in a large room at the civic center.", "発表会はどこで行いますか。", ["公園", "駅", "市民センター", "学校"], 2, "event"),
    ("reading-habit", "読書の習慣", "寝る前にスマートフォンを見るのをやめて、本を読むようにしています。そのほうがよく眠れる気がします。", "I have stopped looking at my smartphone before bed and try to read a book. I feel that helps me sleep better.", "寝る前に何を読むようにしていますか。", ["新聞", "メール", "本", "地図"], 2, "routine"),
    ("neighbor-help", "隣人の手伝い", "旅行中の隣人に頼まれて、毎朝花に水をやっています。帰ってくるのは来週の月曜日だそうです。", "At my neighbor's request, I water the flowers every morning while they travel. They apparently return next Monday.", "私は毎朝何をしますか。", ["犬を散歩させます", "花に水をやります", "新聞を買います", "部屋を掃除します"], 1, "people"),
    ("office-meeting", "会社の会議", "会議は午後三時に始まります。資料を十部印刷して、始まる前に会議室の机へ置いておきます。", "The meeting starts at three in the afternoon. I will print ten copies of the materials and put them on the meeting-room table beforehand.", "資料を何部印刷しますか。", ["五部", "八部", "十部", "十五部"], 2, "work"),
    ("festival-food", "祭りの食べ物", "祭りでは、焼きそばを食べたり、友達と写真を撮ったりしました。最後に花火を見てから帰りました。", "At the festival, I ate yakisoba and took photos with friends. Finally, I watched fireworks before going home.", "最後に何を見ましたか。", ["映画", "花火", "電車", "写真"], 1, "event"),
    ("package-delivery", "荷物の配達", "荷物が届いたとき家にいなかったので、配達員に電話しました。明日の午後にもう一度来てもらうことになりました。", "I was not home when the package arrived, so I called the delivery person. We arranged for them to come again tomorrow afternoon.", "配達員はいつ来ますか。", ["今日の朝", "今日の夜", "明日の午後", "来週"], 2, "daily-life"),
]

N4_MID = [
    ("first-workday", "初めての仕事", "初めてアルバイトをした日は、店の仕事を覚えるだけで大変でした。しかし、先輩が親切に教えてくれたので、三日目には一人で注文を受けられるようになりました。", "On my first day of part-time work, learning the shop duties was difficult. However, a senior coworker taught me kindly, so by the third day I could take orders alone.", "三日目には何ができるようになりましたか。", ["料理を作ること", "注文を受けること", "店を掃除すること", "電車に乗ること"], 1, "work"),
    ("travel-change", "旅行の変更", "家族で山へ行く予定でしたが、天気予報によると週末は大雨になるそうです。そのため、旅行を一週間後に延ばし、今週は近くの博物館へ行くことにしました。", "We planned to go to the mountains as a family, but the forecast says there will be heavy rain this weekend. Therefore we postponed the trip a week and decided to visit a nearby museum this week.", "旅行をいつに延ばしましたか。", ["明日", "週末", "一週間後", "来月"], 2, "travel"),
    ("health-routine", "健康のために", "最近、仕事のあとで疲れすぎて運動できませんでした。そこで、朝少し早く起きて、駅まで歩くことにしました。一か月続けたら、前より元気になりました。", "Recently I was too tired after work to exercise. So I decided to get up a little earlier and walk to the station. After a month I became more energetic.", "なぜ朝歩くことにしましたか。", ["駅が近いから", "仕事のあとに疲れていたから", "友達に誘われたから", "雨が多いから"], 1, "health"),
    ("community-class", "地域の教室", "町のセンターで外国人向けの日本語教室が始まりました。参加費は無料ですが、毎週水曜日の夜に通わなければなりません。私は会話を上達させたいので参加するつもりです。", "A Japanese class for foreigners began at the community center. It is free, but participants must attend every Wednesday night. I plan to join because I want to improve conversation.", "なぜ参加するつもりですか。", ["無料だから", "会話を上達させたいから", "水曜日が休みだから", "センターが近いから"], 1, "study"),
    ("house-repair", "家の修理", "昨日から台所の水道が壊れています。管理会社に連絡したところ、明日の午前中に修理の人が来るそうです。それまで、隣の水道を使うことにしました。", "The kitchen faucet has been broken since yesterday. The management company said a repair person will come tomorrow morning. Until then, we decided to use the neighbor's faucet.", "修理の人はいつ来ますか。", ["昨日", "今日の午後", "明日の午前中", "明日の夜"], 2, "home"),
    ("book-report", "本の発表", "授業で読んだ本について発表することになりました。私は主人公の行動を説明し、友達は本の時代背景を調べます。発表は来週の金曜日です。", "We have to present on a book read in class. I will explain the protagonist's actions, and my friend will research the historical setting. The presentation is next Friday.", "私は何を説明しますか。", ["時代背景", "主人公の行動", "作者の住所", "本の値段"], 1, "study"),
    ("shopping-return", "買った服", "買ったシャツを家で着てみると、少し小さかったので店に戻りました。店員に相談したら、別のサイズと交換してくれました。", "When I tried on the shirt at home, it was a little small, so I returned to the shop. After consulting the clerk, they exchanged it for another size.", "シャツをどうしましたか。", ["捨てました", "友達にあげました", "別のサイズと交換しました", "そのまま着ました"], 2, "shopping"),
    ("school-council", "学校の会議", "学生会では、文化祭で何をするか話し合いました。去年は食べ物を売りましたが、今年はみんなで劇をする案が選ばれました。", "The student council discussed what to do at the cultural festival. Last year they sold food, but this year the proposal to perform a play together was chosen.", "今年は何をすることになりましたか。", ["食べ物を売る", "劇をする", "旅行する", "歌を録音する"], 1, "school"),
    ("weather-clothes", "天気と服", "朝は暖かかったので薄い上着を着て出かけました。しかし夕方から風が強くなると聞いて、帰りに店でマフラーを買いました。", "It was warm in the morning, so I went out in a light jacket. But after hearing the wind would get stronger in the evening, I bought a scarf at a shop on the way home.", "なぜマフラーを買いましたか。", ["雨が降ったから", "風が強くなると聞いたから", "上着をなくしたから", "店が安かったから"], 1, "weather"),
    ("family-meal", "家族の食事", "父の誕生日に、家族でレストランへ行きました。父は魚料理を選び、母は肉料理を選びました。私は二人が好きなケーキを注文しました。", "For Father's birthday, the family went to a restaurant. Father chose fish, Mother chose meat, and I ordered a cake they both like.", "私は何を注文しましたか。", ["魚料理", "肉料理", "ケーキ", "飲み物"], 2, "food"),
    ("commute-book", "通勤時間", "電車に乗っている時間が長いので、最近はその間に小説を読むようになりました。駅に着く前に一章読めることもあります。", "Because my train ride is long, I recently started reading novels during it. Sometimes I can read one chapter before reaching the station.", "いつ小説を読みますか。", ["家で寝る前", "電車に乗っている間", "駅で働いている間", "昼ご飯のあとだけ"], 1, "routine"),
    ("volunteer-day", "ボランティアの日", "日曜日に町の公園を掃除するボランティアに参加しました。朝はごみを拾い、午後は新しい花を植えました。", "On Sunday I joined a volunteer activity to clean the town park. In the morning we picked up trash, and in the afternoon we planted new flowers.", "午後は何をしましたか。", ["ごみを拾いました", "花を植えました", "料理をしました", "本を読みました"], 1, "community"),
    ("language-goal", "日本語の目標", "今年は日本語の新聞を読めるようになりたいです。そのために、毎日新しい言葉を十個覚え、週末には短い記事を読んでいます。", "This year I want to be able to read Japanese newspapers. To do that, I learn ten new words every day and read short articles on weekends.", "何のために新しい言葉を覚えていますか。", ["旅行するため", "新聞を読むため", "料理をするため", "仕事を休むため"], 1, "study"),
    ("repair-appointment", "修理の予約", "洗濯機の音が大きくなったので、修理を頼みました。担当者は金曜日の午後に来ますが、部品がなければ来週になるかもしれません。", "The washing machine became noisy, so I requested a repair. The technician will come Friday afternoon, but if there is no part it may be next week.", "担当者はいつ来る予定ですか。", ["木曜日の朝", "金曜日の午後", "土曜日の夜", "来週の月曜日"], 1, "home"),
]

N4_RETRIEVAL = [
    ("train-notice", "電車のお知らせ", "電車の案内\n工事のため、土曜日は午前九時から午後二時まで運休します。駅から隣町までは代わりのバスを利用してください。", "Train notice: Due to construction, trains stop Saturday from 9 a.m. to 2 p.m. Use a replacement bus from the station to the neighboring town.", "土曜日、何時まで電車が止まりますか。", ["午前九時", "正午", "午後二時", "午後五時"], 2, "notice"),
    ("city-library", "市立図書館", "市立図書館\n月・水・金：午後八時まで\n火・木：午後五時まで\n土曜日：午後六時まで\n日曜日：休館", "City library: Monday/Wednesday/Friday until 8 p.m.; Tuesday/Thursday until 5; Saturday until 6; closed Sunday.", "火曜日は何時まで開いていますか。", ["午後五時", "午後六時", "午後七時", "午後八時"], 0, "notice"),
    ("hotel-plan", "ホテルの案内", "宿泊プラン\n朝食付き：一泊8,000円\n朝食なし：一泊6,500円\n朝食は午前七時から九時まで一階で食べられます。", "Hotel plans: with breakfast 8,000 yen per night; without breakfast 6,500 yen. Breakfast is served on the first floor from 7 to 9.", "朝食はどこで食べられますか。", ["二階", "一階", "部屋", "駅"], 1, "hotel"),
    ("sports-center", "スポーツセンター", "スポーツセンターの利用時間\n平日：午前七時〜午後九時\n土曜：午前九時〜午後六時\n日曜：午前九時〜午後三時\n水曜日は休みです。", "Sports center hours: weekdays 7 a.m.–9 p.m.; Saturday 9–6; Sunday 9–3. Closed Wednesday.", "水曜日に利用できますか。", ["はい、朝だけ", "はい、午後だけ", "いいえ、休みです", "日曜日だけです"], 2, "schedule"),
    ("course-poster", "講座のポスター", "写真講座\n全四回・毎週土曜日\n開始：六月三日\n持ち物：カメラ、ノート\n参加費：2,000円", "Photography course: four sessions every Saturday, starting June 3. Bring a camera and notebook. Fee 2,000 yen.", "何を持っていかなければなりませんか。", ["カメラとノート", "本と傘", "弁当と水", "パソコンと鍵"], 0, "event"),
    ("market-map", "市場の案内", "市場の場所\n入口の右：野菜と果物\n入口の左：魚\n二階：服と靴\n出口の近く：休憩所", "Market map: vegetables and fruit right of the entrance; fish left; clothes and shoes on the second floor; rest area near the exit.", "魚はどこにありますか。", ["入口の右", "入口の左", "二階", "出口の近く"], 1, "directions"),
    ("office-event", "会社の行事", "社員研修は九月十五日です。午前は会議室で説明を聞き、午後は近くの工場を見学します。昼食は会社が用意します。", "Employee training is September 15. In the morning listen to an explanation in the conference room; in the afternoon tour a nearby factory. The company provides lunch.", "午後は何をしますか。", ["会議をします", "工場を見学します", "昼食を作ります", "家へ帰ります"], 1, "work"),
    ("clinic-booking", "診療所の予約", "診療所は予約が必要です。電話受付は午前八時から十時まで、インターネット受付は前日の午後六時までです。", "Appointments are required at the clinic. Phone reception is 8–10 a.m.; online booking closes at 6 p.m. the day before.", "インターネットでいつまで予約できますか。", ["当日の朝", "前日の午後六時", "前日の夜十時", "一週間前"], 1, "health"),
    ("school-trip", "校外学習", "校外学習の日は、学校に八時半までに集合してください。昼食と水を持ってきて、動きやすい靴を履いてください。雨の場合は中止します。", "For the field trip, gather at school by 8:30. Bring lunch and water and wear easy-to-move-in shoes. It will be cancelled if it rains.", "雨の場合はどうなりますか。", ["学校へ行きます", "延期します", "中止します", "昼食を買います"], 2, "school"),
    ("apartment-rules", "アパートの規則", "アパートでは、夜十時以降に大きな音を出してはいけません。ごみは決められた曜日の朝に、建物の後ろへ出してください。", "In the apartment, do not make loud noise after 10 p.m. Put garbage behind the building in the morning on the designated days.", "ごみはどこへ出しますか。", ["建物の前", "建物の後ろ", "駅の近く", "部屋の中"], 1, "home"),
    ("restaurant-booking", "レストランの予約", "予約は二名から受け付けています。午後六時の席はいっぱいですが、七時半なら窓の近くの席があります。", "The restaurant accepts reservations for two or more people. The 6 p.m. tables are full, but a table near the window is available at 7:30.", "窓の近くの席は何時ならありますか。", ["五時", "六時", "七時", "七時半"], 3, "restaurant"),
    ("museum-ticket", "博物館のチケット", "博物館の入場料は大人600円、学生300円です。企画展を見る場合は、別に200円必要です。月曜日は無料ですが、予約が必要です。", "Museum admission is 600 yen for adults and 300 for students. The special exhibit costs 200 yen extra. Monday is free, but reservations are required.", "学生が企画展を見るにはいくら必要ですか。", ["200円", "300円", "500円", "600円"], 2, "museum"),
    ("weather-plan", "週末の天気予報", "土曜日は晴れますが、日曜日は午後から雨になるでしょう。外で活動するなら、土曜日の午前中にしたほうがよさそうです。", "Saturday will be sunny, but Sunday will likely rain from the afternoon. For outdoor activities, Saturday morning seems best.", "外の活動はいつがよさそうですか。", ["土曜日の午前中", "土曜日の夜", "日曜日の午後", "日曜日の夜"], 0, "weather"),
    ("delivery-options", "荷物の受け取り", "荷物は平日の午前中に届けられます。家にいない場合は、駅前のロッカーで受け取るか、土曜日に再配達を頼めます。", "The package can be delivered on weekday mornings. If you are not home, you can receive it in a locker by the station or request redelivery Saturday.", "家にいない場合、どこで受け取れますか。", ["学校の受付", "駅前のロッカー", "病院", "公園"], 1, "delivery"),
    ("community-bus", "町のバス", "町のバスは一日三本です。駅を八時、十二時、午後四時に出発します。病院へ行く人は、二つ目の停留所で降りてください。", "The community bus runs three times a day. It leaves the station at 8, 12, and 4. People going to the hospital should get off at the second stop.", "病院へ行く人はどこで降りますか。", ["一つ目", "二つ目", "三つ目", "駅"], 1, "transport"),
]


def build() -> dict:
    readings = [
        *short_rows("N5", N5_SHORT),
        *mid_rows("N5", N5_MID),
        *retrieval_rows("N5", N5_RETRIEVAL),
        *short_rows("N4", N4_SHORT),
        *mid_rows("N4", N4_MID),
        *retrieval_rows("N4", N4_RETRIEVAL),
    ]
    n5 = [item["id"] for item in readings if item["jlptLevel"] == "N5"]
    n4 = [item["id"] for item in readings if item["jlptLevel"] == "N4"]
    return {
        "course": {"chapters": [{"id": "chapter-original-reading", "slug": "original-reading", "title": "Original reading practice", "description": "Original reading material calibrated to N5 and N4 reading families.", "region": "assessment", "lessons": [
            {"id": "lesson-original-n5-reading", "slug": "original-n5-reading", "title": "N5 reading practice", "subtitle": "Original short texts, notices, and schedules", "description": "Build reading transfer with short original N5 material.", "estimatedMinutes": 25, "itemIds": n5},
            {"id": "lesson-original-n4-reading", "slug": "original-n4-reading", "title": "N4 reading practice", "subtitle": "Original narratives and practical information", "description": "Practice longer original N4 narratives and notices.", "estimatedMinutes": 30, "itemIds": n4},
        ]}]},
        "readings": readings,
        "source": {"id": "michi-curated-n5-seed", "role": "Kizashi-authored assessment reading"},
    }


def main() -> None:
    payload = build()
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    by_level = {level: sum(item["jlptLevel"] == level for item in payload["readings"]) for level in ("N5", "N4")}
    by_family = {(level, family): sum(item["jlptLevel"] == level and item["subcategory"] == family for item in payload["readings"]) for level in ("N5", "N4") for family in ("short", "mid", "information-retrieval")}
    print("Generated", OUTPUT.relative_to(ROOT), by_level, by_family)


if __name__ == "__main__":
    main()
