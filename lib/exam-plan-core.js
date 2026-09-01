const DAY_MS = 86400000;

function dateKey(date) {
  const value = date instanceof Date ? date : new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function dateOnly(value) {
  const match = /^\d{4}-\d{2}-\d{2}$/u.exec(String(value ?? ""));
  if (!match) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

export function getDaysRemaining(examDate, now = new Date()) {
  const target = dateOnly(examDate);
  if (!target) return null;
  const today = dateOnly(dateKey(now));
  return Math.round((target.getTime() - today.getTime()) / DAY_MS);
}

export function normalizeExamPlan(value = {}) {
  const availableStudyDays = Array.isArray(value.availableStudyDays) ? [...new Set(value.availableStudyDays.map(Number).filter((day) => day >= 0 && day <= 6))].sort() : [1, 2, 3, 4, 5];
  return {
    targetLevel: value.targetLevel === "N4" ? "N4" : "N5",
    examDate: typeof value.examDate === "string" && dateOnly(value.examDate) ? value.examDate : "",
    paused: value.paused === true,
    dailyMinutes: [2, 5, 10, 20, 30].includes(Number(value.dailyMinutes)) ? Number(value.dailyMinutes) : 10,
    availableStudyDays: availableStudyDays.length ? availableStudyDays : [1, 2, 3, 4, 5],
    restDays: Array.isArray(value.restDays) ? [...new Set(value.restDays.map(Number).filter((day) => day >= 0 && day <= 6))].sort() : [],
  };
}

/** @param {{examDate?: string, now?: Date, dueCount?: number, weakCount?: number, recentAccuracy?: number|null, readiness?: string, paused?: boolean}} options */
export function getAdaptivePlan({ examDate = "", now = new Date(), dueCount = 0, weakCount = 0, recentAccuracy = null, readiness = "untested", paused = false } = {}) {
  const daysRemaining = getDaysRemaining(examDate, now);
  const due = Math.max(0, Number(dueCount) || 0);
  const weak = Math.max(0, Number(weakCount) || 0);
  let action;
  if (paused) action = { key: "resume", label: "Resume exam plan", href: "/profile" };
  else if (due) action = { key: "review", label: "Review due cards", href: "/review" };
  else if (weak) action = { key: "repair", label: "Repair a weak concept", href: "/practice?mode=weak" };
  else if (daysRemaining !== null && daysRemaining <= 21) action = { key: "integrated", label: "Run an integrated exam set", href: "/practice?mode=integrated" };
  else if (recentAccuracy !== null && Number(recentAccuracy) < 0.75) action = { key: "integrated", label: "Run an integrated exam set", href: "/practice?mode=integrated" };
  else action = { key: "continue", label: "Continue your lesson", href: "/learn" };
  const state = paused ? "paused" : daysRemaining === null ? "no-date" : daysRemaining < 0 ? "overdue" : daysRemaining === 0 ? "today" : readiness === "exam-ready" || readiness === "strong" ? "ready" : "active";
  return { daysRemaining, state, action, dueCount: due, weakCount: weak, readiness, recentAccuracy };
}
