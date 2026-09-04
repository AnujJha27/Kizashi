export const interestOptions = Object.freeze([
  Object.freeze({ value: "anime/manga", label: "Anime / manga", keywords: ["anime", "manga", "comic"] }),
  Object.freeze({ value: "technology", label: "Technology", keywords: ["technology", "computer", "phone", "internet", "digital"] }),
  Object.freeze({ value: "food", label: "Food", keywords: ["food", "cafe", "restaurant", "cooking", "meal", "shop"] }),
  Object.freeze({ value: "travel", label: "Travel", keywords: ["travel", "trip", "station", "train", "transport", "airport", "journey"] }),
  Object.freeze({ value: "music", label: "Music", keywords: ["music", "song", "concert"] }),
  Object.freeze({ value: "books", label: "Books", keywords: ["book", "reading", "library", "story"] }),
  Object.freeze({ value: "daily life", label: "Daily life", keywords: ["daily", "routine", "home", "errand", "shopping"] }),
  Object.freeze({ value: "culture", label: "Culture", keywords: ["culture", "festival", "custom", "history"] }),
  Object.freeze({ value: "sports", label: "Sports", keywords: ["sport", "baseball", "soccer", "futsal", "game"] }),
]);

const allowedTopics = new Set(interestOptions.map((option) => option.value));

/** @param {unknown} value @returns {string[]} */
export function normalizeInterestTopics(value) {
  return [...new Set((Array.isArray(value) ? value : []).filter((topic) => typeof topic === "string").map((topic) => topic.trim().toLowerCase()).filter((topic) => allowedTopics.has(topic)))].slice(0, 3);
}

/** @param {any} item @param {readonly string[]} interests @returns {number} */
export function interestScore(item, interests = []) {
  const text = [item?.title, item?.situation, item?.subcategory, item?.description, item?.passage, ...(item?.tags ?? [])].filter(Boolean).join(" ").toLowerCase();
  return normalizeInterestTopics(interests).reduce((score, interest) => score + (interestOptions.find((option) => option.value === interest)?.keywords.some((keyword) => text.includes(keyword)) ? 1 : 0), 0);
}
