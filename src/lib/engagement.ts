const VISITS_KEY = "yike_visit_count";
const LAST_VISIT_KEY = "yike_last_visit";
const SAVES_KEY = "yike_engagement_saves";

export function recordVisit() {
  if (typeof window === "undefined") return;
  try {
    const count = Number(localStorage.getItem(VISITS_KEY) ?? "0") + 1;
    localStorage.setItem(VISITS_KEY, String(count));
    localStorage.setItem(LAST_VISIT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function getVisitCount(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(VISITS_KEY) ?? "0");
}

export function recordEngagementSave() {
  if (typeof window === "undefined") return;
  try {
    const count = Number(localStorage.getItem(SAVES_KEY) ?? "0") + 1;
    localStorage.setItem(SAVES_KEY, String(count));
  } catch {
    /* ignore */
  }
}

export function getEngagementSaveCount(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(SAVES_KEY) ?? "0");
}
