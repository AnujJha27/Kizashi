export const IMMERSION_VIDEO_REVIEWS_STORAGE_KEY = "michi.immersion-video-reviews";
const STORAGE_KEY = IMMERSION_VIDEO_REVIEWS_STORAGE_KEY;
const STATUSES = new Set(["clear", "shaky", "missed"]);

function readStore() {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([, review]) => review && typeof review === "object" && STATUSES.has(review.status) && typeof review.updatedAt === "number"));
  } catch {
    return {};
  }
}

export function readImmersionVideoReviews() {
  return readStore();
}

export function recordImmersionVideoReview(videoId, status) {
  if (typeof window === "undefined" || !videoId || !STATUSES.has(status)) return false;
  const reviews = readStore();
  reviews[videoId] = { status, updatedAt: Date.now() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    window.dispatchEvent(new Event("michi-immersion-review-updated"));
    return true;
  } catch {
    return false;
  }
}
