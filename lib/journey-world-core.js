const todayVisualPaths = Object.freeze({
  neighborhood: "/world/today.webp",
  station: "/world/today-station.webp",
  "shopping-street": "/world/today-shopping-street.webp",
  riverside: "/world/today-riverside.webp",
  garden: "/world/today-garden.webp",
  market: "/world/today-market.webp",
  assessment: "/world/today-assessment.webp",
  "wide-station": "/world/today-wide-station.webp",
});

function visualAssets(areaId) {
  const path = `/world/${areaId}.webp`;
  return Object.freeze({ shell: path, hero: path, today: todayVisualPaths[areaId] ?? todayVisualPaths.neighborhood, lesson: "/world/lesson-wide.webp", immersion: path, portrait: path });
}

function visualAssetMetadata(area) {
  const assets = visualAssets(area.id);
  return Object.freeze(["shell", "hero", "today", "lesson", "immersion", "portrait", "transition"].map((role) => ({
    id: `${area.id}-${role}`,
    areaId: area.id,
    role,
    path: assets[role] ?? assets.hero,
    sourceType: "generated-raster",
    creator: "OpenAI image generation, commissioned by Kizashi",
    license: "Kizashi project asset",
    attribution: "Kizashi generated asset",
    focalPoint: role === "portrait" ? area.focalPoint.mobile : area.focalPoint.desktop,
    dominantMood: area.accents.atmosphere,
  })));
}

const areaDefinitions = {
  neighborhood: { id: "neighborhood", level: "N5", title: "Neighborhood", japaneseTitle: "住宅街", environment: "neighborhood", description: "A familiar street where names, greetings, and the morning route begin.", region: "quiet-city", focalPoint: { desktop: "center 42%", mobile: "left 38%" }, accents: { primary: "#b78d67", secondary: "#6d8790", atmosphere: "warm" } },
  station: { id: "station", level: "N5", title: "Station district", japaneseTitle: "駅前", environment: "station", description: "The station gathers time, movement, and the small errands of an ordinary day.", region: "train-line", focalPoint: { desktop: "center 36%", mobile: "right 32%" }, accents: { primary: "#7198a8", secondary: "#d19a61", atmosphere: "steel" } },
  shoppingStreet: { id: "shopping-street", level: "N5", title: "Shopping street", japaneseTitle: "商店街", environment: "shopping-street", description: "A lived-in street for food, weather, directions, and useful choices.", region: "small-town", focalPoint: { desktop: "left 44%", mobile: "left 30%" }, accents: { primary: "#c48e58", secondary: "#a66a5a", atmosphere: "amber" } },
  riverside: { id: "riverside", level: "N5", title: "Riverside", japaneseTitle: "川辺", environment: "coast", description: "Plans and conversations open the route beyond the first streets.", region: "riverside-town", focalPoint: { desktop: "right 48%", mobile: "right 42%" }, accents: { primary: "#7297a0", secondary: "#b58568", atmosphere: "open" } },
  garden: { id: "garden", level: "N5", title: "Garden road", japaneseTitle: "庭の道", environment: "neighborhood", description: "Health, school, weather, and hobbies make the familiar town feel larger.", region: "garden-road", focalPoint: { desktop: "left 40%", mobile: "left 34%" }, accents: { primary: "#7d9a7d", secondary: "#c49a66", atmosphere: "green" } },
  market: { id: "market", level: "N5", title: "Market road", japaneseTitle: "市場通り", environment: "shopping-street", description: "Practical errands turn the language into something you can use.", region: "market-road", focalPoint: { desktop: "right 40%", mobile: "right 34%" }, accents: { primary: "#c58a5d", secondary: "#8f6f67", atmosphere: "market" } },
  assessment: { id: "assessment", level: "N5", title: "Study room", japaneseTitle: "学びの部屋", environment: "library", description: "A quiet place to see what transfers beyond the lesson path.", region: "assessment", focalPoint: { desktop: "center 40%", mobile: "center 34%" }, accents: { primary: "#81958b", secondary: "#778ca0", atmosphere: "quiet" } },
  wideStation: { id: "wide-station", level: "N4", title: "The wider station", japaneseTitle: "大きな駅", environment: "train", description: "The familiar town gives way to a wider route and more independent Japanese.", region: "assessment", milestoneLabel: "A new road", focalPoint: { desktop: "right 30%", mobile: "right 24%" }, accents: { primary: "#7595ad", secondary: "#c58c64", atmosphere: "twilight" } },
};

const regionToAreaId = Object.freeze({ "quiet-city": "neighborhood", "train-line": "station", "station-district": "wide-station", "small-town": "shopping-street", "riverside-town": "riverside", "garden-road": "garden", "market-road": "market", assessment: "assessment" });
const lessonToAreaId = Object.freeze({
  "lesson-meeting-people": "neighborhood",
  "lesson-morning-route": "neighborhood",
  "lesson-food-and-routines": "station",
  "lesson-weather-and-shopping": "station",
  "lesson-home-and-directions": "shopping-street",
  "lesson-plans-and-descriptions": "shopping-street",
  "lesson-conversation-and-plans": "riverside",
  "lesson-health-and-school": "garden",
  "lesson-weather-and-hobbies": "garden",
  "lesson-practical-errands": "market",
  "lesson-n4-prerequisites": "wide-station",
  "lesson-original-n4-1": "wide-station",
  "lesson-original-n4-2": "wide-station",
  "lesson-original-n4-3": "wide-station",
  "lesson-original-n4-4": "wide-station",
  "lesson-original-n4-reading": "wide-station",
  "lesson-n4-actions-and-intentions": "wide-station",
});

function lessonIdsFor(areaId) {
  return Object.freeze(Object.entries(lessonToAreaId).filter(([, mappedAreaId]) => mappedAreaId === areaId).map(([lessonId]) => lessonId));
}

function progressionStages() {
  return Object.freeze([
    Object.freeze({ id: "arrival", label: "Arrival", threshold: 0 }),
    Object.freeze({ id: "lived-in", label: "Lived in", threshold: 0.4 }),
    Object.freeze({ id: "settled", label: "Settled", threshold: 0.85 }),
  ]);
}

export const journeyVisualManifest = Object.freeze(Object.fromEntries(Object.values(areaDefinitions).map((area) => [area.id, Object.freeze({ ...area, lessonIds: lessonIdsFor(area.id), visualAssets: visualAssets(area.id), visualAssetMetadata: visualAssetMetadata(area), progressionStages: progressionStages() })])));
const defaultJourneyLessons = Object.freeze(Object.values(journeyVisualManifest).flatMap((area) => area.lessonIds.map((id) => ({ id, level: area.level, region: area.region }))));

export function getAreaForLessonId(lessonId, region, targetLevel = "N5") {
  if (lessonToAreaId[lessonId] && (targetLevel === "N4" || !lessonId.startsWith("lesson-original-n4-"))) return journeyVisualManifest[lessonToAreaId[lessonId]];
  return journeyVisualManifest[regionToAreaId[region] ?? "neighborhood"];
}

/** @param {{ lessonId?: string; lessons?: Array<{ id: string; region?: string; itemIds?: string[] }>; records?: Record<string, unknown>; targetLevel?: string }} options */
export function getJourneyWorldState({ lessonId = "lesson-meeting-people", lessons = [], records = {}, targetLevel = "N5" } = {}) {
  const resolvedLessons = lessons.length ? lessons : defaultJourneyLessons.filter((lesson) => lesson.level === targetLevel);
  const activeLesson = resolvedLessons.find((lesson) => lesson.id === lessonId);
  const area = getAreaForLessonId(lessonId, activeLesson?.region, targetLevel);
  const areaLessons = resolvedLessons.filter((lesson) => getAreaForLessonId(lesson.id, lesson.region, targetLevel).id === area.id);
  const itemIds = areaLessons.flatMap((lesson) => lesson.itemIds ?? []);
  const learnedItems = itemIds.filter((itemId) => records[itemId]).length;
  const progress = itemIds.length ? learnedItems / itemIds.length : 0;
  const activeIndex = Math.max(0, areaLessons.findIndex((lesson) => lesson.id === lessonId));
  const threshold = Math.max(progress, areaLessons.length > 1 ? activeIndex / areaLessons.length : 0);
  const stages = area.progressionStages;
  const stage = [...stages].reverse().find((candidate) => threshold >= candidate.threshold) ?? stages[0];
  return { area, stage, progress, learnedItems, totalItems: itemIds.length, activeLessonId: lessonId, targetLevel };
}

/** @param {{ lessonId: string; lessons?: Array<{ id: string; region?: string; itemIds?: string[] }>; targetLevel?: string }} options */
export function getNextJourneyArea({ lessonId, lessons = [], targetLevel = "N5" }) {
  const current = lessons.find((lesson) => lesson.id === lessonId);
  const currentArea = getAreaForLessonId(lessonId, current?.region, targetLevel);
  const currentIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
  const next = lessons.slice(currentIndex + 1).find((lesson) => getAreaForLessonId(lesson.id, lesson.region, targetLevel).id !== currentArea.id);
  return next ? getAreaForLessonId(next.id, next.region, targetLevel) : null;
}
