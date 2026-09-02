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
  { id: "tae-kim-grammar", sourceId: "tae-kim", name: "Tae Kim's Guide", title: "Alternative grammar explanation", description: "A structural, Japanese-first alternative explanation for mapped grammar points.", resourceType: "grammar-reference", url: "https://guidetojapanese.org/learn/grammar", deliveryMode: "reference", tags: ["alternative-explanation"], license: "CC BY-NC-SA 3.0", attribution: "Tae Kim's Guide to Japanese", transformAllowed: false, metadata: { role: "alternative grammar intuition", rightsBehavior: "deep-link; do-not-relabel-source-prose" } },
  { id: "wikibooks-japanese-grammar", sourceId: "wikibooks-japanese", name: "Wikibooks Japanese", title: "Japanese grammar reference", description: "Supplementary reference for particles, counters, conjugation, and pronunciation.", resourceType: "reference", url: "https://en.wikibooks.org/wiki/Japanese_Grammar", deliveryMode: "reference", tags: ["reference"], license: "CC BY-SA 4.0 / GFDL", attribution: "Wikibooks Japanese", transformAllowed: false, metadata: { role: "supplementary grammar reference", rightsBehavior: "MediaWiki API with attribution" } },
  { id: "wikimedia-commons-lingua-libre", sourceId: "wikimedia-commons", name: "Wikimedia Commons / Lingua Libre", title: "Human pronunciation", description: "Resolve compatible Japanese recordings dynamically without downloading the library.", resourceType: "pronunciation", url: "https://commons.wikimedia.org/wiki/Category:Japanese_pronunciation", deliveryMode: "dynamic", tags: ["human-audio", "pronunciation"], metadata: { role: "dynamic human pronunciation", rightsBehavior: "per-file-license-validation" } },
  { id: "aozora-bunko", sourceId: "aozora-bunko", name: "Aozora Bunko", title: "Native reading", description: "Long-form native reading for later immersion, with estimated difficulty.", resourceType: "native-reading", url: "https://www.aozora.gr.jp/", deliveryMode: "dynamic", tags: ["native-reading"], metadata: { role: "native reading", rightsBehavior: "public-domain-status-filter" } },
  { id: "tadoku-free-books", sourceId: "tadoku", name: "Free Tadoku Books", title: "Graded extensive reading", description: "Provider-hosted unchanged graded readers for beginner extensive reading.", resourceType: "graded-reader", level: "Start", url: "https://tadoku.org/japanese/en/free-books-en/", deliveryMode: "frame-or-link", tags: ["graded-reading"], transformAllowed: false, metadata: { role: "graded extensive-reading", rightsBehavior: "unchanged-provider-hosted-content" } },
  { id: "irodori-practical-lessons", sourceId: "irodori", name: "Irodori", title: "Practical Japanese lessons", description: "Can-do lessons, practical contexts, and source-hosted resources that reinforce Kizashi study.", resourceType: "lesson", level: "Beginner", url: "https://www.irodori.jpf.go.jp/en/", deliveryMode: "frame-or-link", tags: ["can-do", "real-world-practice"], transformAllowed: false, metadata: { role: "practical situational practice", rightsBehavior: "official-source-resource" } },
  { id: "irodori-ordering-food", sourceId: "irodori", name: "Irodori", title: "Order at a fast food restaurant", description: "A Can-do follow-up for practicing a real restaurant interaction after Kizashi food and request study.", resourceType: "lesson", level: "Starter", url: "https://www.irodori.jpf.go.jp/en/starter/audio/lesson06.html", deliveryMode: "frame-or-link", targetItemIds: ["grammar-kudasai", "grammar-wo", "vocab-gohan"], targetSkills: ["real-world-practice"], tags: ["can-do", "food", "real-world-practice"], license: "Official provider-hosted educational material; see source terms", attribution: "The Japan Foundation Japanese-Language Institute, Urawa", transformAllowed: false, metadata: { role: "real-world practice", rightsBehavior: "official-source-resource", shelf: false, course: "Starter", lesson: "Lesson 6", canDo: "Order at a fast food restaurant", resourceTypes: ["lesson", "script", "audio page"], audioAvailable: true, audioDelivery: "provider-hosted", audioPage: "https://www.irodori.jpf.go.jp/en/starter/audio/lesson06.html", termsUrl: "https://www.irodori.jpf.go.jp/en/faq.html", sourcePage: "https://www.irodori.jpf.go.jp/en/starter/pdf.html" } },
  { id: "irodori-starter-01", sourceId: "irodori", name: "Irodori", title: "Good morning!", description: "Use basic greetings in a classroom and hear them in a short natural exchange.", resourceType: "lesson", level: "A1 · Starter", url: "https://www.irodori.jpf.go.jp/en/starter/audio/lesson01.html", deliveryMode: "frame-or-link", targetSkills: ["real-world-practice"], tags: ["can-do", "greetings", "real-world-practice"], license: "Official provider-hosted educational material; see source terms", attribution: "The Japan Foundation Japanese-Language Institute, Urawa", transformAllowed: false, metadata: { role: "practical situational practice", rightsBehavior: "official-source-resource", shelf: false, course: "Starter", lesson: "Lesson 1", canDo: "Greet people and respond to a greeting.", resourceTypes: ["listening", "dialogue", "shadowing", "real-life task"], audioAvailable: true, audioDelivery: "provider-hosted", audioPage: "https://www.irodori.jpf.go.jp/en/starter/audio/lesson01.html", termsUrl: "https://www.irodori.jpf.go.jp/en/faq.html", sourcePage: "https://www.irodori.jpf.go.jp/en/starter/pdf.html" } },
  { id: "irodori-starter-03", sourceId: "irodori", name: "Irodori", title: "Nice to meet you.", description: "Practice introducing yourself and responding politely in a first meeting.", resourceType: "lesson", level: "A1 · Starter", url: "https://www.irodori.jpf.go.jp/en/starter/audio/lesson03.html", deliveryMode: "frame-or-link", targetSkills: ["real-world-practice", "self-introduction"], targetItemIds: ["grammar-desu"], tags: ["can-do", "introductions", "real-world-practice"], license: "Official provider-hosted educational material; see source terms", attribution: "The Japan Foundation Japanese-Language Institute, Urawa", transformAllowed: false, metadata: { role: "practical situational practice", rightsBehavior: "official-source-resource", shelf: false, course: "Starter", lesson: "Lesson 3", canDo: "Introduce yourself and ask someone's name.", resourceTypes: ["listening", "dialogue", "shadowing", "real-life task"], audioAvailable: true, audioDelivery: "provider-hosted", audioPage: "https://www.irodori.jpf.go.jp/en/starter/audio/lesson03.html", termsUrl: "https://www.irodori.jpf.go.jp/en/faq.html", sourcePage: "https://www.irodori.jpf.go.jp/en/starter/pdf.html" } },
  { id: "irodori-starter-04", sourceId: "irodori", name: "Irodori", title: "I live in Tokyo.", description: "Talk about where you live and recognize the same information in practical listening.", resourceType: "lesson", level: "A1 · Starter", url: "https://www.irodori.jpf.go.jp/en/starter/audio/lesson04.html", deliveryMode: "frame-or-link", targetSkills: ["real-world-practice"], targetItemIds: ["grammar-ni"], tags: ["can-do", "home", "real-world-practice"], license: "Official provider-hosted educational material; see source terms", attribution: "The Japan Foundation Japanese-Language Institute, Urawa", transformAllowed: false, metadata: { role: "practical situational practice", rightsBehavior: "official-source-resource", shelf: false, course: "Starter", lesson: "Lesson 4", canDo: "Say where you live.", resourceTypes: ["listening", "dialogue", "shadowing", "real-life task"], audioAvailable: true, audioDelivery: "provider-hosted", audioPage: "https://www.irodori.jpf.go.jp/en/starter/audio/lesson04.html", termsUrl: "https://www.irodori.jpf.go.jp/en/faq.html", sourcePage: "https://www.irodori.jpf.go.jp/en/starter/pdf.html" } },
  { id: "irodori-starter-05", sourceId: "irodori", name: "Irodori", title: "I like udon.", description: "Say what food you like and follow a beginner conversation about favorite foods.", resourceType: "lesson", level: "A1 · Starter", url: "https://www.irodori.jpf.go.jp/en/starter/audio/lesson05.html", deliveryMode: "frame-or-link", targetSkills: ["real-world-practice"], tags: ["can-do", "food", "real-world-practice"], license: "Official provider-hosted educational material; see source terms", attribution: "The Japan Foundation Japanese-Language Institute, Urawa", transformAllowed: false, metadata: { role: "practical situational practice", rightsBehavior: "official-source-resource", shelf: false, course: "Starter", lesson: "Lesson 5", canDo: "Say what food you like.", resourceTypes: ["listening", "dialogue", "shadowing", "real-life task"], audioAvailable: true, audioDelivery: "provider-hosted", audioPage: "https://www.irodori.jpf.go.jp/en/starter/audio/lesson05.html", termsUrl: "https://www.irodori.jpf.go.jp/en/faq.html", sourcePage: "https://www.irodori.jpf.go.jp/en/starter/pdf.html" } },
  { id: "irodori-elementary1-01", sourceId: "irodori", name: "Irodori", title: "I work in a restaurant.", description: "Step into a workplace conversation and shadow practical restaurant language.", resourceType: "lesson", level: "A2 · Elementary 1", url: "https://www.irodori.jpf.go.jp/en/elementary01/audio/lesson01.html", deliveryMode: "frame-or-link", targetSkills: ["real-world-practice"], tags: ["can-do", "work", "real-world-practice"], license: "Official provider-hosted educational material; see source terms", attribution: "The Japan Foundation Japanese-Language Institute, Urawa", transformAllowed: false, metadata: { role: "practical situational practice", rightsBehavior: "official-source-resource", shelf: false, course: "Elementary 1", lesson: "Lesson 1", canDo: "Talk about your work in a restaurant.", resourceTypes: ["listening", "dialogue", "shadowing", "real-life task"], audioAvailable: true, audioDelivery: "provider-hosted", audioPage: "https://www.irodori.jpf.go.jp/en/elementary01/audio/lesson01.html", termsUrl: "https://www.irodori.jpf.go.jp/en/faq.html", sourcePage: "https://www.irodori.jpf.go.jp/en/elementary01/pdf.html" } },
  { id: "irodori-elementary1-06", sourceId: "irodori", name: "Irodori", title: "Please tell me how to get to the post office.", description: "Practice asking for directions and listening for a useful route in town.", resourceType: "lesson", level: "A2 · Elementary 1", url: "https://www.irodori.jpf.go.jp/en/elementary01/audio/lesson06.html", deliveryMode: "frame-or-link", targetSkills: ["real-world-practice"], targetItemIds: ["vocab-doko", "grammar-ni", "grammar-de"], tags: ["can-do", "directions", "real-world-practice"], license: "Official provider-hosted educational material; see source terms", attribution: "The Japan Foundation Japanese-Language Institute, Urawa", transformAllowed: false, metadata: { role: "practical situational practice", rightsBehavior: "official-source-resource", shelf: false, course: "Elementary 1", lesson: "Lesson 6", canDo: "Ask how to get to a place and understand directions.", resourceTypes: ["listening", "dialogue", "shadowing", "real-life task"], audioAvailable: true, audioDelivery: "provider-hosted", audioPage: "https://www.irodori.jpf.go.jp/en/elementary01/audio/lesson06.html", termsUrl: "https://www.irodori.jpf.go.jp/en/faq.html", sourcePage: "https://www.irodori.jpf.go.jp/en/elementary01/pdf.html" } },
].map(freezeResource));

export const externalResources = registry;

export function getExternalResources(filters = {}) {
  const includeHidden = Boolean(filters.itemId || filters.skill);
  return Object.freeze(registry.filter((resource) => {
    if (resource.metadata?.shelf === false && !includeHidden) return false;
    if (filters.itemId && !resource.targetItemIds?.includes(filters.itemId)) return false;
    if (filters.skill && !resource.targetSkills?.includes(filters.skill)) return false;
    if (filters.type && resource.resourceType !== filters.type) return false;
    if (filters.tag && !resource.tags?.includes(filters.tag)) return false;
    return true;
  }));
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
  if (resource.deliveryMode === "frame-or-link" && value === "original-site") return "original-site";
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
