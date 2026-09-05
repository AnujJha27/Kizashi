function freezeValue(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(freezeValue));
  if (value && typeof value === "object") return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, freezeValue(nestedValue)])));
  return value;
}

function freezeResource(resource) {
  return freezeValue(resource);
}

const erinIndexedLessons = Object.freeze([
  ["01", "First-meeting Greetings · Classroom"],
  ["02", "Making Requests · School"],
  ["03", "Indicating Things · Home"],
  ["04", "Asking Locations · Convenience Store"],
  ["05", "Expressing Time · Cram School"],
  ["06", "Asking Prices · Bus"],
  ["07", "Discussing Interests · Friend's Room"],
  ["08", "Ordering · Fast-Food"],
  ["09", "Describing Present Situation · After-school Lessons"],
  ["10", "Asking Permission · Fashion"],
  ["11", "Describing Order of Events · Hot Springs"],
  ["12", "Talking with Friends · Club Activities"],
  ["13", "Asking How · Train Station"],
  ["14", "Making Assumptions · Cell Phones"],
  ["15", "Expressing Desires · Festivals"],
  ["16", "Explaining · Injuries and Illness"],
  ["17", "Describing Contradictory Ideas · In Class"],
  ["18", "Comparing · 100-yen Shop"],
  ["19", "Giving Reasons · Part-time Jobs"],
  ["20", "Talking about Experiences · School Trip"],
  ["21", "Asking about Rules · Leisure"],
  ["22", "Explaining Problems · Trouble"],
  ["23", "Making Suggestions to Friends · Amusement Park"],
  ["24", "Describing Changes · School Festival"],
  ["25", "Conveying What You Feel · Parting"],
]);

const erinIndexedResources = erinIndexedLessons.flatMap(([lesson, title]) => ["basic", "advanced"].map((skit) => ({
  id: `erin-${skit}-${lesson}`,
  sourceId: "erin",
  name: "Erin's Challenge",
  title: `${title} · ${skit === "basic" ? "Basic skit" : "Advanced skit"}`,
  description: "Provider-hosted Erin skit page with the original video, script, and related learning materials.",
  resourceType: "lesson",
  level: skit === "basic" ? "N5–N4" : "N4–N3",
  url: `https://www.erin.jpf.go.jp/en/lesson/${lesson}/${skit}/`,
  deliveryMode: "frame-or-link",
  tags: ["situational-japanese", "skit", skit],
  transformAllowed: false,
  metadata: { role: "provider-hosted situational dialogue", rightsBehavior: "original-site-media", shelf: false, lesson: `Lesson ${Number(lesson)}`, activityType: skit, annotationStatus: "indexed", resourceTypes: [`${skit} skit`, "script", "video page"] },
})));

const irodoriLessonCatalog = [
  ["starter", "Starter", "A1", ["Good morning!", "I'm sorry, I don't really understand.", "Nice to meet you.", "I live in Tokyo.", "I like udon.", "I'd like a cheeseburger, please.", "There are four rooms.", "Where is Yamada-san?", "Lunch is from noon to 1 o'clock.", "Please lend me the stapler.", "What kind of manga do you like?", "Do you want to go for a drink together?", "Does this bus go to the airport?", "It's a big building, isn't it.", "I need some batteries.", "How much is this?", "I went to see a movie.", "I want to go to a hot spring."]],
  ["elementary01", "Elementary 1", "A2", ["I work in a restaurant.", "I like playing video games.", "It gets very cold in winter.", "It rained heavily yesterday.", "It is very lively and convenient.", "Please tell me how to get to the post office.", "I will be a bit late because I got lost.", "Have you ever played baseball?", "Will you tell me how to read this?", "I would like to take a Japanese-language class.", "I will bring meat and vegetables.", "Your bento looks delicious.", "It will probably end in about ten minutes.", "May I take a day off?", "I have a fever, and my throat is sore.", "I try not to eat too much.", "This is a personal amulet my older brother gave me.", "How about giving something as a gift?"]],
  ["elementary02", "Elementary 2", "A2", ["I just came to Japan last week.", "He looks a serious person.", "I cannot eat it because of an allergy.", "Please eat it without soy sauce.", "You should make a reservation early.", "I am glad that I went to a lot of different places.", "If it rains, it will be held at the hall.", "Do you know where the food stands are?", "What do people do on Coming-of-Age Day?", "What kind of clothes should I wear?", "I forgot to bring my point card.", "This vacuum cleaner is light and easy to move around.", "They display a lot of materials.", "Will you cut my bangs a little shorter?", "The lights in the meeting room were left on.", "Do not panic in case of an earthquake.", "I can speak Japanese better than before.", "I am thinking about starting my own company in the future."]],
  ["pre-intermediate", "Pre-Intermediate", "A2/B1", ["What is futsal again?", "I like watching TV dramas the most.", "How are preparations for your move going?", "It seems like the air conditioner is broken...", "What kind of restaurant would be good?", "I cook for myself every day.", "I hope I can become friends with many people.", "May I sit next to you？", "What made you interested in studying Japanese?", "How do you study Japanese?", "This is a scam email.", "I need an ambulance.", "Congratulations on your marriage.", "I’m troubled about a friend.", "I want to see Sakurajima.", "I was able to take lots of good photos.", "I will explain the work of the floor staff.", "I would be happy if you would allow me to work there."]],
].flatMap(([courseSlug, course, level, titles]) => titles.map((title, index) => ({ courseSlug, course, level, title, lessonNumber: index + 1 })));

const curatedIrodoriLessons = new Set(["starter-1", "starter-3", "starter-4", "starter-5", "starter-6", "elementary01-1", "elementary01-6"]);
const irodoriLessonResources = irodoriLessonCatalog.filter(({ courseSlug, lessonNumber }) => !curatedIrodoriLessons.has(`${courseSlug}-${lessonNumber}`)).map(({ courseSlug, course, level, title, lessonNumber }) => {
  const lesson = String(lessonNumber).padStart(2, "0");
  const url = `https://www.irodori.jpf.go.jp/en/${courseSlug}/audio/lesson${lesson}.html`;
  return {
    id: `irodori-${courseSlug}-${lesson}`,
    sourceId: "irodori",
    name: "Irodori",
    title,
    description: `Official ${course} Lesson ${lessonNumber} audio page and practical learning material.`,
    resourceType: "lesson",
    level,
    url,
    deliveryMode: "frame-or-link",
    targetSkills: ["real-world-practice"],
    tags: ["can-do", "real-world-practice", courseSlug],
    license: "Official provider-hosted educational material; see source terms",
    attribution: "The Japan Foundation Japanese-Language Institute, Urawa",
    transformAllowed: false,
    metadata: {
      role: "practical situational practice",
      rightsBehavior: "official-source-resource",
      shelf: false,
      course,
      lesson: `Lesson ${lessonNumber}`,
      canDo: title,
      resourceTypes: ["lesson", "listening", "audio page"],
      audioAvailable: true,
      audioDelivery: "provider-hosted",
      audioPage: url,
      termsUrl: "https://www.irodori.jpf.go.jp/en/faq.html",
      sourcePage: `https://www.irodori.jpf.go.jp/en/${courseSlug}/pdf.html`,
    },
  };
});

const registry = Object.freeze([
  { id: "erin", sourceId: "erin", name: "Erin's Challenge", title: "Beginner situational Japanese", description: "25 Basic and 25 Advanced Japan Foundation skits for natural dialogue and shadowing.", resourceType: "lesson", level: "N5–N3", url: "https://www.erin.jpf.go.jp/en/", deliveryMode: "frame-or-link", targetSkills: ["natural dialogue", "shadowing"], tags: ["situational-japanese", "shelf"], metadata: { role: "beginner situational dialogue", rightsBehavior: "original-site-media", lessonIds: ["erin-01", "erin-02", "erin-03", "erin-04", "erin-06", "erin-08"], indexedLessonCount: 50, basicLessonCount: 25, advancedLessonCount: 25 } },
  { id: "erin-01", sourceId: "erin", name: "Erin's Challenge", title: "First-meeting greetings · classroom", description: "Stream the Japan Foundation video directly from its original site; scripts and controls remain available from the lesson page.", resourceType: "lesson", level: "N5", url: "https://www.erin.jpf.go.jp/en/lesson/01/basic/", deliveryMode: "frame-or-link", targetSkills: ["self-introduction"], targetItemIds: ["vocab-watashi", "grammar-desu", "grammar-wa"], metadata: { role: "beginner situational dialogue", rightsBehavior: "original-site-media", shelf: false, context: "greetings", annotationStatus: "reviewed", reviewedAt: "2026-08-31", resourceTypes: ["basic skit", "script PDF", "script audio MP3"], transcriptAvailable: true, translationAvailable: true, mediaDelivery: "original-site", mediaUrl: "https://www.erin.jpf.go.jp/movie/01/01-ba_high.mp4", posterUrl: "https://www.erin.jpf.go.jp/movie/poster/01-ba.jpg" } },
  { id: "erin-02", sourceId: "erin", name: "Erin's Challenge", title: "Making requests · school", description: "Stream the Japan Foundation video directly from its original site; scripts and controls remain available from the lesson page.", resourceType: "lesson", level: "N5", url: "https://www.erin.jpf.go.jp/en/lesson/02/basic/", deliveryMode: "frame-or-link", targetSkills: ["polite request"], targetItemIds: ["grammar-kudasai", "grammar-wo"], metadata: { role: "beginner situational dialogue", rightsBehavior: "original-site-media", shelf: false, context: "requests", annotationStatus: "reviewed", reviewedAt: "2026-08-31", resourceTypes: ["basic skit", "script PDF", "script audio MP3"], transcriptAvailable: true, translationAvailable: true, mediaDelivery: "original-site", mediaUrl: "https://www.erin.jpf.go.jp/movie/02/02-ba_high.mp4", posterUrl: "https://www.erin.jpf.go.jp/movie/poster/02-ba.jpg" } },
  { id: "erin-03", sourceId: "erin", name: "Erin's Challenge", title: "Indicating things · home", description: "Stream the Japan Foundation video directly from its original site; scripts and controls remain available from the lesson page.", resourceType: "lesson", level: "N5", url: "https://www.erin.jpf.go.jp/en/lesson/03/basic/", deliveryMode: "frame-or-link", targetSkills: ["object reference"], targetItemIds: ["vocab-kore", "vocab-sore", "grammar-kore"], metadata: { role: "beginner situational dialogue", rightsBehavior: "original-site-media", shelf: false, context: "demonstratives", annotationStatus: "reviewed", reviewedAt: "2026-08-31", resourceTypes: ["basic skit", "script PDF", "script audio MP3"], transcriptAvailable: true, translationAvailable: true, mediaDelivery: "original-site", mediaUrl: "https://www.erin.jpf.go.jp/movie/03/03-ba_high.mp4", posterUrl: "https://www.erin.jpf.go.jp/movie/poster/03-ba.jpg" } },
  { id: "erin-04", sourceId: "erin", name: "Erin's Challenge", title: "Asking locations · convenience store", description: "Stream the Japan Foundation video directly from its original site; scripts and controls remain available from the lesson page.", resourceType: "lesson", level: "N5", url: "https://www.erin.jpf.go.jp/en/lesson/04/basic/", deliveryMode: "frame-or-link", targetSkills: ["location question"], targetItemIds: ["vocab-doko", "grammar-doko", "grammar-ni", "grammar-de"], metadata: { role: "beginner situational dialogue", rightsBehavior: "original-site-media", shelf: false, context: "locations", annotationStatus: "reviewed", reviewedAt: "2026-08-31", resourceTypes: ["basic skit", "script PDF", "script audio MP3"], transcriptAvailable: true, translationAvailable: true, mediaDelivery: "original-site", mediaUrl: "https://www.erin.jpf.go.jp/movie/04/04-ba_high.mp4", posterUrl: "https://www.erin.jpf.go.jp/movie/poster/04-ba.jpg" } },
  { id: "erin-06", sourceId: "erin", name: "Erin's Challenge", title: "Asking prices · bus", description: "Stream the Japan Foundation video directly from its original site; scripts and controls remain available from the lesson page.", resourceType: "lesson", level: "N5", url: "https://www.erin.jpf.go.jp/en/lesson/06/basic/", deliveryMode: "frame-or-link", targetSkills: ["price question"], targetItemIds: ["vocab-ikura", "vocab-en", "grammar-ka"], metadata: { role: "beginner situational dialogue", rightsBehavior: "original-site-media", shelf: false, context: "prices", annotationStatus: "reviewed", reviewedAt: "2026-08-31", resourceTypes: ["basic skit", "script PDF", "script audio MP3"], transcriptAvailable: true, translationAvailable: true, mediaDelivery: "original-site", mediaUrl: "https://www.erin.jpf.go.jp/movie/06/06-ba_high.mp4", posterUrl: "https://www.erin.jpf.go.jp/movie/poster/06-ba.jpg" } },
  { id: "erin-08", sourceId: "erin", name: "Erin's Challenge", title: "Ordering · fast food", description: "Stream the Japan Foundation video directly from its original site; scripts and controls remain available from the lesson page.", resourceType: "lesson", level: "N5", url: "https://www.erin.jpf.go.jp/en/lesson/08/basic/", deliveryMode: "frame-or-link", targetSkills: ["service interaction"], targetItemIds: ["vocab-gohan", "grammar-kudasai", "grammar-wo"], metadata: { role: "beginner situational dialogue", rightsBehavior: "original-site-media", shelf: false, context: "ordering food", annotationStatus: "reviewed", reviewedAt: "2026-08-31", resourceTypes: ["basic skit", "script PDF", "script audio MP3"], transcriptAvailable: true, translationAvailable: true, mediaDelivery: "original-site", mediaUrl: "https://www.erin.jpf.go.jp/movie/08/08-ba_high.mp4", posterUrl: "https://www.erin.jpf.go.jp/movie/poster/08-ba.jpg" } },
  ...erinIndexedResources,
  { id: "cejc", sourceId: "cejc", name: "CEJC", description: "Authorized conversational corpus listening and naturalness evidence.", resourceType: "listening", url: "https://chunagon.ninjal.ac.jp/shc/", deliveryMode: "frame-or-link", metadata: { role: "real conversational patterns", rightsBehavior: "authorized-session-only" } },
  { id: "csj", sourceId: "csj", name: "CSJ", description: "Authorized spoken-corpus listening for broad spoken Japanese exposure.", resourceType: "listening", url: "https://chunagon.ninjal.ac.jp/auth/login", deliveryMode: "frame-or-link", metadata: { role: "spoken-corpus exposure", rightsBehavior: "authorized-session-only" } },
  { id: "common-voice", sourceId: "common-voice", name: "Common Voice Japanese", description: "Broad human-speaker exposure without re-hosting the dataset.", resourceType: "listening", url: "https://mozilladatacollective.com/datasets/cmqim4lxy00tunr07cjkcupeg", deliveryMode: "frame-or-link", metadata: { role: "diverse human voices", rightsBehavior: "provider-hosted" } },
  { id: "tatoeba", sourceId: "tatoeba", name: "Tatoeba audio", description: "Exact sentence-level human recordings with contributor-level attribution when the API reports a reusable license.", resourceType: "listening", url: "https://tatoeba.org/en/audio/index/jpn", deliveryMode: "frame-or-link", metadata: { role: "sentence-linked human audio", rightsBehavior: "provider-hosted; per-recording license check", audioDelivery: "provider-hosted", apiUrl: "https://api.tatoeba.org/v1/sentences" } },
  { id: "jsut", sourceId: "jsut", name: "JSUT", description: "Clean Japanese speech corpus for controlled listening exposure.", resourceType: "listening", url: "https://sites.google.com/site/shinnosuketakamichi/publication/jsut", deliveryMode: "frame-or-link", metadata: { role: "controlled speech", rightsBehavior: "provider-hosted" } },
  { id: "japanese-pod101", sourceId: "japanese-pod101", name: "JapanesePod101", description: "Polished learner-oriented beginner listening material.", resourceType: "listening", url: "https://www.japanesepod101.com/lesson-library/level-1-japanese", deliveryMode: "frame-or-link", metadata: { role: "polished learner listening", rightsBehavior: "provider-hosted" } },
  { id: "japanese-with-shun", sourceId: "japanese-with-shun", name: "Japanese with Shun", title: "Easy Japanese video catalog", description: "A rotating catalog of provider-hosted beginner-friendly videos for natural N5–N4 listening; choose the episode that fits today.", resourceType: "listening", level: "N5–N4", url: "https://www.youtube.com/@JapanesewithShun", deliveryMode: "frame-or-link", targetSkills: ["natural listening", "immersion"], tags: ["easy-japanese", "video", "immersion"], transformAllowed: false, metadata: { role: "easy-Japanese video immersion", rightsBehavior: "provider-hosted YouTube video; official channel fallback", resourceTypes: ["video catalog", "channel"], videoCatalogFeed: "https://www.youtube.com/feeds/videos.xml?channel_id=UCu6sZrHyl4hSS2PvlUo2XZA", videoCatalogChannelId: "UCu6sZrHyl4hSS2PvlUo2XZA" } },
  { id: "nihongo-con-teppei", sourceId: "nihongo-con-teppei", name: "Nihongo con Teppei", title: "Beginner podcast episode catalog", description: "A rotating catalog of the real beginner podcast, with provider-hosted audio when the episode feed supplies it and an official-site fallback.", resourceType: "listening", level: "N5–N4", url: "https://nihongoconteppei.com/", deliveryMode: "frame-or-link", targetSkills: ["natural listening", "immersion"], tags: ["beginner-podcast", "audio", "immersion"], transformAllowed: false, metadata: { role: "beginner podcast immersion", rightsBehavior: "official RSS metadata; provider-hosted audio; original-site fallback", mediaDelivery: "remote-media", podcastFeed: "https://nihongoconteppei.com/feed/", resourceTypes: ["podcast", "episodes", "audio"] } },
  { id: "tae-kim-grammar", sourceId: "tae-kim", name: "Tae Kim's Guide", title: "Alternative grammar explanation", description: "A structural, Japanese-first alternative explanation for mapped grammar points.", resourceType: "grammar-reference", url: "https://guidetojapanese.org/learn/grammar", deliveryMode: "reference", tags: ["alternative-explanation"], license: "CC BY-NC-SA 3.0", attribution: "Tae Kim's Guide to Japanese", transformAllowed: false, metadata: { role: "alternative grammar intuition", rightsBehavior: "deep-link; do-not-relabel-source-prose" } },
  { id: "wikibooks-japanese-grammar", sourceId: "wikibooks-japanese", name: "Wikibooks Japanese", title: "Japanese grammar reference", description: "Supplementary reference for particles, counters, conjugation, and pronunciation.", resourceType: "reference", url: "https://en.wikibooks.org/wiki/Japanese_Grammar", deliveryMode: "reference", tags: ["reference"], license: "CC BY-SA 4.0 / GFDL", attribution: "Wikibooks Japanese", transformAllowed: false, metadata: { role: "supplementary grammar reference", rightsBehavior: "MediaWiki API with attribution" } },
  { id: "wikimedia-commons-lingua-libre", sourceId: "wikimedia-commons", name: "Wikimedia Commons / Lingua Libre", title: "Human pronunciation", description: "Resolve compatible Japanese recordings dynamically without downloading the library.", resourceType: "pronunciation", url: "https://commons.wikimedia.org/wiki/Category:Japanese_pronunciation", deliveryMode: "dynamic", tags: ["human-audio", "pronunciation"], metadata: { role: "dynamic human pronunciation", rightsBehavior: "per-file-license-validation" } },
  { id: "aozora-bunko", sourceId: "aozora-bunko", name: "Aozora Bunko", title: "Native reading", description: "Long-form native reading for later immersion, with estimated difficulty.", resourceType: "native-reading", url: "https://www.aozora.gr.jp/", deliveryMode: "dynamic", tags: ["native-reading"], metadata: { role: "native reading", rightsBehavior: "public-domain-status-filter" } },
  { id: "tadoku-free-books", sourceId: "tadoku", name: "Free Tadoku Books", title: "Graded extensive reading", description: "Provider-hosted unchanged graded readers for beginner extensive reading.", resourceType: "graded-reader", level: "Start", url: "https://tadoku.org/japanese/en/free-books-en/", deliveryMode: "frame-or-link", tags: ["graded-reading"], transformAllowed: false, metadata: { role: "graded extensive-reading", rightsBehavior: "unchanged-provider-hosted-content" } },
  { id: "irodori-practical-lessons", sourceId: "irodori", name: "Irodori", title: "Practical Japanese lessons", description: "Can-do lessons, practical contexts, and source-hosted resources that reinforce Kizashi study.", resourceType: "lesson", level: "Beginner", url: "https://www.irodori.jpf.go.jp/en/", deliveryMode: "frame-or-link", tags: ["can-do", "real-world-practice"], transformAllowed: false, metadata: { role: "practical situational practice", rightsBehavior: "official-source-resource" } },
  { id: "marugoto-plus", sourceId: "marugoto", name: "Marugoto Plus", title: "Can-do conversation and culture", description: "Provider-hosted conversation, listening, pronunciation, and culture activities that reinforce practical Japanese.", resourceType: "lesson", level: "A1–A2", url: "https://marugotoweb.jp/en/", deliveryMode: "frame-or-link", targetItemIds: ["vocab-watashi", "vocab-gakusei", "vocab-gohan", "vocab-taberu", "vocab-doko", "vocab-ikura", "grammar-desu", "grammar-wa", "grammar-masu", "grammar-ni", "grammar-kudasai"], targetSkills: ["real-world-practice", "natural listening", "shadowing", "pronunciation"], tags: ["immersion-provider", "practical-reading", "can-do"], transformAllowed: false, metadata: { role: "can-do conversation and pronunciation reinforcement", rightsBehavior: "provider-hosted; source terms control", context: "Starter · conversations and everyday situations", resourceTypes: ["conversation", "listening", "pronunciation", "culture"], catalog: [{ id: "marugoto-greetings", title: "Greet and introduce yourself", sourceLevel: "A1", topic: "Starter · self-introduction", activityType: "conversation", url: "https://marugotoweb.jp/en/", audioAvailable: true, targetItemIds: ["vocab-watashi", "vocab-gakusei", "grammar-desu", "grammar-wa"], targetSkills: ["real-world-practice", "natural listening", "shadowing"], communicativeFunction: "self-introduction", jlptRelevance: "N5 bridge · reviewed mapping", provenance: "Marugoto Plus official activity index; provider-hosted" }, { id: "marugoto-ordering", title: "Order food and make a request", sourceLevel: "A1", topic: "Starter · food and service", activityType: "conversation + listening", url: "https://marugotoweb.jp/en/", audioAvailable: true, targetItemIds: ["vocab-gohan", "vocab-taberu", "grammar-kudasai", "grammar-wo"], targetSkills: ["real-world-practice", "pronunciation"], communicativeFunction: "order and request politely", jlptRelevance: "N5 bridge · reviewed mapping", provenance: "Marugoto Plus official activity index; provider-hosted" }, { id: "marugoto-directions", title: "Ask about a place", sourceLevel: "A1", topic: "Starter · places and directions", activityType: "Can-do practice", url: "https://marugotoweb.jp/en/", audioAvailable: true, targetItemIds: ["vocab-doko", "grammar-ni"], targetSkills: ["real-world-practice", "shadowing"], communicativeFunction: "ask where something is", jlptRelevance: "N5 bridge · reviewed mapping", provenance: "Marugoto Plus official activity index; provider-hosted" }] } },
  { id: "jfs-reading-activities", sourceId: "jfs-reading", name: "JFS Reading Activities", title: "Practical reading tasks", description: "Provider-hosted A1–A2 reading tasks for menus, notices, schedules, prices, messages, and everyday information.", resourceType: "reference", level: "A1–A2", url: "https://www.kyozai.jpf.go.jp/kyozai/material/jfs/home/ja/render.do", deliveryMode: "frame-or-link", targetSkills: ["practical reading", "real-world-practice"], tags: ["immersion-provider", "practical-reading", "information-retrieval"], transformAllowed: false, metadata: { role: "practical reading and information retrieval", rightsBehavior: "provider-hosted; source terms control", resourceTypes: ["reading activity", "notice", "menu", "schedule"], catalog: [{ id: "jfs-menu", title: "Read a restaurant menu", sourceLevel: "A1", topic: "food and ordering", activityType: "practical reading", url: "https://www.kyozai.jpf.go.jp/kyozai/material/jfs/home/ja/render.do", targetItemIds: ["vocab-gohan", "grammar-kudasai", "grammar-wo"], targetSkills: ["practical reading", "information retrieval"], communicativeFunction: "choose and request food", jlptRelevance: "N5 bridge · reviewed mapping", provenance: "JFS Reading Activities official index; provider-hosted" }, { id: "jfs-notice", title: "Find a notice detail", sourceLevel: "A1", topic: "notices and opening hours", activityType: "information retrieval", url: "https://www.kyozai.jpf.go.jp/kyozai/material/jfs/home/ja/render.do", targetItemIds: ["grammar-ni", "grammar-de"], targetSkills: ["practical reading", "information retrieval"], communicativeFunction: "find time and place details", jlptRelevance: "N5 bridge · reviewed mapping", provenance: "JFS Reading Activities official index; provider-hosted" }, { id: "jfs-price", title: "Check a price and schedule", sourceLevel: "A1", topic: "prices and schedules", activityType: "practical reading", url: "https://www.kyozai.jpf.go.jp/kyozai/material/jfs/home/ja/render.do", targetItemIds: ["vocab-ikura", "vocab-en", "grammar-ka"], targetSkills: ["practical reading", "real-world-practice"], communicativeFunction: "retrieve a price or time", jlptRelevance: "N5 bridge · reviewed mapping", provenance: "JFS Reading Activities official index; provider-hosted" }] } },
  { id: "kc-yom-yom", sourceId: "kc-yom-yom", name: "KC Yom Yom", title: "Easy Japanese extensive reading", description: "Provider-hosted short books and optional audio from the Japan Foundation Kansai Center.", resourceType: "graded-reader", level: "A1–A2/B1", url: "https://www.jpf.go.jp/j/kansai/clip/yomyom/index.html", deliveryMode: "frame-or-link", targetSkills: ["extensive reading", "natural listening"], tags: ["immersion-provider", "extensive-reading", "graded-reading"], license: "CC BY-NC 2.1 Japan (provider page); verify individual asset terms", attribution: "Japan Foundation Japanese-Language Institute, Kansai", transformAllowed: false, metadata: { role: "extensive reading", rightsBehavior: "provider-hosted; preserve asset attribution", resourceTypes: ["graded reader", "optional audio"], catalog: [{ id: "kc-daily-life", title: "A short everyday story", sourceLevel: "A1", topic: "daily life", activityType: "graded reader", url: "https://www.jpf.go.jp/j/kansai/clip/yomyom/index.html", audioAvailable: true, length: "short story", progress: "local opened state", jlptRelevance: "immersion only · no JLPT claim", provenance: "KC Yom Yom official index; provider-hosted" }, { id: "kc-family", title: "A family story", sourceLevel: "A1–A2", topic: "family and community", activityType: "graded reader", url: "https://www.jpf.go.jp/j/kansai/clip/yomyom/index.html", audioAvailable: true, length: "short book", progress: "local opened state", jlptRelevance: "immersion only · no JLPT claim", provenance: "KC Yom Yom official index; provider-hosted" }, { id: "kc-town", title: "A town story", sourceLevel: "A2/B1", topic: "places and culture", activityType: "graded reader", url: "https://www.jpf.go.jp/j/kansai/clip/yomyom/index.html", audioAvailable: false, length: "short book", progress: "local opened state", jlptRelevance: "immersion only · no JLPT claim", provenance: "KC Yom Yom official index; provider-hosted" }] } },
  { id: "hirogaru", sourceId: "hirogaru", name: "Hirogaru", title: "Learn through interests", description: "Interest-driven Japanese reading and video across food, music, books, anime, outdoors, and culture.", resourceType: "lesson", level: "Beginner–Intermediate", url: "https://www.hirogaru-nihongo.jpf.go.jp/en/", deliveryMode: "frame-or-link", targetSkills: ["immersion", "natural listening", "extensive reading"], tags: ["immersion-provider", "interest-driven", "culture", "video"], transformAllowed: false, metadata: { role: "interest-driven reading and listening", rightsBehavior: "provider-hosted; site policy controls", resourceTypes: ["article", "video", "culture"], catalog: [{ id: "hirogaru-food", title: "Food and everyday life", sourceLevel: "Beginner–Intermediate", topic: "food", activityType: "article + video", url: "https://www.hirogaru-nihongo.jpf.go.jp/en/", videoAvailable: true, targetSkills: ["immersion", "extensive reading"], communicativeFunction: "explore a personal interest", jlptRelevance: "immersion only · no JLPT claim", provenance: "Hirogaru official topic index; provider-hosted" }, { id: "hirogaru-music", title: "Music and performance", sourceLevel: "Beginner–Intermediate", topic: "music", activityType: "article + video", url: "https://www.hirogaru-nihongo.jpf.go.jp/en/", videoAvailable: true, targetSkills: ["immersion", "natural listening"], communicativeFunction: "follow interest-led listening", jlptRelevance: "immersion only · no JLPT claim", provenance: "Hirogaru official topic index; provider-hosted" }, { id: "hirogaru-books", title: "Books and stories", sourceLevel: "Beginner–Intermediate", topic: "books", activityType: "article", url: "https://www.hirogaru-nihongo.jpf.go.jp/en/", targetSkills: ["immersion", "extensive reading"], communicativeFunction: "read around an interest", jlptRelevance: "immersion only · no JLPT claim", provenance: "Hirogaru official topic index; provider-hosted" }, { id: "hirogaru-outdoors", title: "Outdoors and places", sourceLevel: "Beginner–Intermediate", topic: "outdoors", activityType: "article + video", url: "https://www.hirogaru-nihongo.jpf.go.jp/en/", videoAvailable: true, targetSkills: ["immersion", "natural listening"], communicativeFunction: "explore culture through place", jlptRelevance: "immersion only · no JLPT claim", provenance: "Hirogaru official topic index; provider-hosted" }] } },
  { id: "ojad", sourceId: "ojad", name: "OJAD", title: "Pronunciation and pitch-accent reference", description: "Optional University of Tokyo accent, conjugation, and prosody reference for pronunciation details.", resourceType: "reference", level: "reference", url: "https://www.gavo.t.u-tokyo.ac.jp/ojad/eng/pages/home", deliveryMode: "frame-or-link", targetSkills: ["pronunciation", "prosody"], tags: ["immersion-provider", "pronunciation", "pitch-accent"], transformAllowed: false, metadata: { role: "optional pronunciation and prosody reference", rightsBehavior: "provider-hosted; do not mirror audio or data", resourceTypes: ["word search", "prosody tutor", "accent reference"], catalog: [{ id: "ojad-accent", title: "Look up pitch accent", sourceLevel: "reference", topic: "pitch accent", activityType: "word search", url: "https://www.gavo.t.u-tokyo.ac.jp/ojad/eng/pages/home", targetSkills: ["pronunciation", "prosody"], communicativeFunction: "inspect a word's accent pattern", jlptRelevance: "optional pronunciation reference · no JLPT gate", provenance: "OJAD official search; no mirrored data" }, { id: "ojad-conjugation", title: "Compare conjugation and prosody", sourceLevel: "reference", topic: "conjugation and prosody", activityType: "prosody tutor", url: "https://www.gavo.t.u-tokyo.ac.jp/ojad/eng/pages/home", targetSkills: ["pronunciation", "prosody"], communicativeFunction: "compare spoken form details", jlptRelevance: "optional pronunciation reference · no JLPT gate", provenance: "OJAD official search; no mirrored data" }] } },
  ...irodoriLessonResources,
  { id: "irodori-ordering-food", sourceId: "irodori", name: "Irodori", title: "Order at a fast food restaurant", description: "A Can-do follow-up for practicing a real restaurant interaction after Kizashi food and request study.", resourceType: "lesson", level: "Starter", url: "https://www.irodori.jpf.go.jp/en/starter/audio/lesson06.html", deliveryMode: "frame-or-link", targetItemIds: ["grammar-kudasai", "grammar-wo", "vocab-gohan"], targetSkills: ["real-world-practice"], tags: ["can-do", "food", "real-world-practice"], license: "Official provider-hosted educational material; see source terms", attribution: "The Japan Foundation Japanese-Language Institute, Urawa", transformAllowed: false, metadata: { role: "real-world practice", rightsBehavior: "official-source-resource", shelf: false, course: "Starter", lesson: "Lesson 6", canDo: "Order at a fast food restaurant", resourceTypes: ["lesson", "script", "audio page"], audioAvailable: true, audioDelivery: "provider-hosted", audioPage: "https://www.irodori.jpf.go.jp/en/starter/audio/lesson06.html", termsUrl: "https://www.irodori.jpf.go.jp/en/faq.html", sourcePage: "https://www.irodori.jpf.go.jp/en/starter/pdf.html" } },
  { id: "irodori-starter-01", sourceId: "irodori", name: "Irodori", title: "Good morning!", description: "Use basic greetings in a classroom and hear them in a short natural exchange.", resourceType: "lesson", level: "A1 · Starter", url: "https://www.irodori.jpf.go.jp/en/starter/audio/lesson01.html", deliveryMode: "frame-or-link", targetSkills: ["real-world-practice"], tags: ["can-do", "greetings", "real-world-practice"], license: "Official provider-hosted educational material; see source terms", attribution: "The Japan Foundation Japanese-Language Institute, Urawa", transformAllowed: false, metadata: { role: "practical situational practice", rightsBehavior: "official-source-resource", shelf: false, course: "Starter", lesson: "Lesson 1", canDo: "Greet people and respond to a greeting.", resourceTypes: ["listening", "dialogue", "shadowing", "real-life task"], audioAvailable: true, audioDelivery: "provider-hosted", audioPage: "https://www.irodori.jpf.go.jp/en/starter/audio/lesson01.html", termsUrl: "https://www.irodori.jpf.go.jp/en/faq.html", sourcePage: "https://www.irodori.jpf.go.jp/en/starter/pdf.html" } },
  { id: "irodori-starter-03", sourceId: "irodori", name: "Irodori", title: "Nice to meet you.", description: "Practice introducing yourself and responding politely in a first meeting.", resourceType: "lesson", level: "A1 · Starter", url: "https://www.irodori.jpf.go.jp/en/starter/audio/lesson03.html", deliveryMode: "frame-or-link", targetSkills: ["real-world-practice", "self-introduction"], targetItemIds: ["grammar-desu"], tags: ["can-do", "introductions", "real-world-practice"], license: "Official provider-hosted educational material; see source terms", attribution: "The Japan Foundation Japanese-Language Institute, Urawa", transformAllowed: false, metadata: { role: "practical situational practice", rightsBehavior: "official-source-resource", shelf: false, course: "Starter", lesson: "Lesson 3", canDo: "Introduce yourself and ask someone's name.", resourceTypes: ["listening", "dialogue", "shadowing", "real-life task"], audioAvailable: true, audioDelivery: "provider-hosted", audioPage: "https://www.irodori.jpf.go.jp/en/starter/audio/lesson03.html", termsUrl: "https://www.irodori.jpf.go.jp/en/faq.html", sourcePage: "https://www.irodori.jpf.go.jp/en/starter/pdf.html" } },
  { id: "irodori-starter-04", sourceId: "irodori", name: "Irodori", title: "I live in Tokyo.", description: "Talk about where you live and recognize the same information in practical listening.", resourceType: "lesson", level: "A1 · Starter", url: "https://www.irodori.jpf.go.jp/en/starter/audio/lesson04.html", deliveryMode: "frame-or-link", targetSkills: ["real-world-practice"], targetItemIds: ["grammar-ni"], tags: ["can-do", "home", "real-world-practice"], license: "Official provider-hosted educational material; see source terms", attribution: "The Japan Foundation Japanese-Language Institute, Urawa", transformAllowed: false, metadata: { role: "practical situational practice", rightsBehavior: "official-source-resource", shelf: false, course: "Starter", lesson: "Lesson 4", canDo: "Say where you live.", resourceTypes: ["listening", "dialogue", "shadowing", "real-life task"], audioAvailable: true, audioDelivery: "provider-hosted", audioPage: "https://www.irodori.jpf.go.jp/en/starter/audio/lesson04.html", termsUrl: "https://www.irodori.jpf.go.jp/en/faq.html", sourcePage: "https://www.irodori.jpf.go.jp/en/starter/pdf.html" } },
  { id: "irodori-starter-05", sourceId: "irodori", name: "Irodori", title: "I like udon.", description: "Say what food you like and follow a beginner conversation about favorite foods.", resourceType: "lesson", level: "A1 · Starter", url: "https://www.irodori.jpf.go.jp/en/starter/audio/lesson05.html", deliveryMode: "frame-or-link", targetSkills: ["real-world-practice"], tags: ["can-do", "food", "real-world-practice"], license: "Official provider-hosted educational material; see source terms", attribution: "The Japan Foundation Japanese-Language Institute, Urawa", transformAllowed: false, metadata: { role: "practical situational practice", rightsBehavior: "official-source-resource", shelf: false, course: "Starter", lesson: "Lesson 5", canDo: "Say what food you like.", resourceTypes: ["listening", "dialogue", "shadowing", "real-life task"], audioAvailable: true, audioDelivery: "provider-hosted", audioPage: "https://www.irodori.jpf.go.jp/en/starter/audio/lesson05.html", termsUrl: "https://www.irodori.jpf.go.jp/en/faq.html", sourcePage: "https://www.irodori.jpf.go.jp/en/starter/pdf.html" } },
  { id: "irodori-elementary1-01", sourceId: "irodori", name: "Irodori", title: "I work in a restaurant.", description: "Step into a workplace conversation and shadow practical restaurant language.", resourceType: "lesson", level: "A2 · Elementary 1", url: "https://www.irodori.jpf.go.jp/en/elementary01/audio/lesson01.html", deliveryMode: "frame-or-link", targetSkills: ["real-world-practice"], tags: ["can-do", "work", "real-world-practice"], license: "Official provider-hosted educational material; see source terms", attribution: "The Japan Foundation Japanese-Language Institute, Urawa", transformAllowed: false, metadata: { role: "practical situational practice", rightsBehavior: "official-source-resource", shelf: false, course: "Elementary 1", lesson: "Lesson 1", canDo: "Talk about your work in a restaurant.", resourceTypes: ["listening", "dialogue", "shadowing", "real-life task"], audioAvailable: true, audioDelivery: "provider-hosted", audioPage: "https://www.irodori.jpf.go.jp/en/elementary01/audio/lesson01.html", termsUrl: "https://www.irodori.jpf.go.jp/en/faq.html", sourcePage: "https://www.irodori.jpf.go.jp/en/elementary01/pdf.html" } },
  { id: "irodori-elementary1-06", sourceId: "irodori", name: "Irodori", title: "Please tell me how to get to the post office.", description: "Practice asking for directions and listening for a useful route in town.", resourceType: "lesson", level: "A2 · Elementary 1", url: "https://www.irodori.jpf.go.jp/en/elementary01/audio/lesson06.html", deliveryMode: "frame-or-link", targetSkills: ["real-world-practice"], targetItemIds: ["vocab-doko", "grammar-ni", "grammar-de"], tags: ["can-do", "directions", "real-world-practice"], license: "Official provider-hosted educational material; see source terms", attribution: "The Japan Foundation Japanese-Language Institute, Urawa", transformAllowed: false, metadata: { role: "practical situational practice", rightsBehavior: "official-source-resource", shelf: false, course: "Elementary 1", lesson: "Lesson 6", canDo: "Ask how to get to a place and understand directions.", resourceTypes: ["listening", "dialogue", "shadowing", "real-life task"], audioAvailable: true, audioDelivery: "provider-hosted", audioPage: "https://www.irodori.jpf.go.jp/en/elementary01/audio/lesson06.html", termsUrl: "https://www.irodori.jpf.go.jp/en/faq.html", sourcePage: "https://www.irodori.jpf.go.jp/en/elementary01/pdf.html" } },
].map(freezeResource));

export const externalResources = registry;

function compareIrodoriResources(left, right) {
  const courseOrder = { Starter: 0, "Elementary 1": 1, "Elementary 2": 2, "Pre-Intermediate": 3 };
  const leftCourse = courseOrder[left.metadata?.course] ?? 99;
  const rightCourse = courseOrder[right.metadata?.course] ?? 99;
  if (leftCourse !== rightCourse) return leftCourse - rightCourse;
  const lessonNumber = (resource) => Number.parseInt(resource.metadata?.lesson?.match(/\d+/)?.[0] ?? "999", 10);
  return lessonNumber(left) - lessonNumber(right);
}

export function getExternalResources(filters = {}) {
  const includeHidden = Boolean(filters.itemId || filters.skill);
  const matches = registry.filter((resource) => {
    if (resource.metadata?.shelf === false && !includeHidden) return false;
    if (filters.itemId && !resource.targetItemIds?.includes(filters.itemId)) return false;
    if (filters.skill && !resource.targetSkills?.includes(filters.skill)) return false;
    if (filters.type && resource.resourceType !== filters.type) return false;
    if (filters.tag && !resource.tags?.includes(filters.tag)) return false;
    return true;
  });
  if (filters.skill === "real-world-practice") {
    return Object.freeze(matches.sort((left, right) => {
      if (left.sourceId !== "irodori" || right.sourceId !== "irodori") return 0;
      return compareIrodoriResources(left, right);
    }));
  }
  return Object.freeze(matches);
}

export function getExternalResourceById(id) {
  return registry.find((resource) => resource.id === id);
}

export function getErinFamilyResource() {
  return getExternalResourceById("erin");
}

export function getErinLessonResources() {
  return Object.freeze(registry.filter((resource) => resource.sourceId === "erin" && resource.id !== "erin" && resource.metadata?.annotationStatus === "reviewed"));
}

function stringValue(value) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function booleanValue(value) {
  return typeof value === "boolean" ? value : undefined;
}

function stringArrayValue(value) {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string" && item.trim()) ? Object.freeze([...value]) : undefined;
}

function deliveryFor(resource) {
  if (resource.deliveryMode === "frame-or-link") return "frame-or-link";
  if (resource.deliveryMode === "remote-media") return "remote-media";
  return "link-only";
}

function mediaDeliveryFor(resource) {
  const value = stringValue(resource.metadata?.mediaDelivery);
  if (resource.deliveryMode === "frame-or-link" && (value === "original-site" || value === "remote-media")) return value;
  return deliveryFor(resource);
}

export function canEmbedExternalSource(delivery) {
  return delivery === "frame-or-link" || delivery === "original-site";
}

export function canPlayExternalSourceMedia(delivery) {
  return delivery === "original-site" || delivery === "remote-media";
}

export function externalResourceToSourceLink(resource) {
  const metadata = resource.metadata ?? {};
  const mediaDelivery = mediaDeliveryFor(resource);
  const mediaUrl = canPlayExternalSourceMedia(mediaDelivery) ? stringValue(metadata.mediaUrl) : undefined;
  return {
    id: resource.id,
    sourceId: resource.sourceId,
    name: resource.name,
    title: resource.title,
    level: resource.level,
    context: stringValue(metadata.context),
    course: stringValue(metadata.course),
    lesson: stringValue(metadata.lesson),
    canDo: stringValue(metadata.canDo),
    targetSkills: resource.targetSkills,
    targetItemIds: resource.targetItemIds,
    description: resource.description ?? "",
    url: resource.url,
    resourceTypes: stringArrayValue(metadata.resourceTypes) ?? Object.freeze([resource.resourceType]),
    mediaDelivery,
    mediaUrl,
    posterUrl: mediaUrl ? stringValue(metadata.posterUrl) : undefined,
    frameUrl: stringValue(metadata.frameUrl) ?? (resource.sourceId === "marugoto" ? "https://a1.marugotoweb.jp/en/" : undefined),
    videoCatalog: Array.isArray(metadata.videoCatalog) ? metadata.videoCatalog : undefined,
    videoCatalogFeed: stringValue(metadata.videoCatalogFeed),
    podcastFeed: stringValue(metadata.podcastFeed),
    catalog: Array.isArray(metadata.catalog) ? metadata.catalog : undefined,
    annotationStatus: stringValue(metadata.annotationStatus),
    reviewedAt: stringValue(metadata.reviewedAt),
    transcriptAvailable: booleanValue(metadata.transcriptAvailable),
    translationAvailable: booleanValue(metadata.translationAvailable),
    license: resource.license,
    attribution: resource.attribution,
  };
}

export function getErinLessonSources() {
  return Object.freeze(getErinLessonResources().map(externalResourceToSourceLink));
}
