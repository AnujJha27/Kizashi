const itemCollections = ["vocabulary", "kanji", "grammar", "readings", "listening"];

export function releaseForLearners(value, releasedAt = new Date().toISOString()) {
  const released = { ...value };
  for (const key of itemCollections) {
    if (!Array.isArray(released[key])) continue;
    released[key] = released[key].map((item) => {
      if (!item || typeof item !== "object" || item.reviewStatus === "rejected" || item.contentReview) return item;
      return item.reviewStatus === "approved"
        ? { ...item, contentReview: { method: "human", humanReviewed: true, releasedAt } }
        : { ...item, contentReview: { method: "automatic", humanReviewed: false, releasedAt } };
    });
  }
  released.learnerRelease = { method: "automatic", humanReviewed: false, releasedAt };
  return released;
}
