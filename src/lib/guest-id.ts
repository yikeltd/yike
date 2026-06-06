const STORAGE_KEY = "yike_guest_id";

function randomGuestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `guest_${crypto.randomUUID().slice(0, 12)}`;
  }
  return `guest_${Date.now().toString(36)}`;
}

/** Stable anonymous id for lead tracking before signup. */
export function getGuestId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = randomGuestId();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return randomGuestId();
  }
}
