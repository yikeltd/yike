const KEY = "yike_recent_contacts";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type Entry = { listingId: string; at: number };

export const RECENT_CONTACT_NOTICE =
  "You recently contacted this listing.";

function read(): Entry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Entry[];
  } catch {
    return [];
  }
}

function write(entries: Entry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, 40)));
  } catch {
    /* ignore */
  }
}

export function markListingContacted(listingId: string): void {
  const now = Date.now();
  const prev = read().filter((e) => e.listingId !== listingId);
  write([{ listingId, at: now }, ...prev]);
}

export function recentContactNotice(listingId: string): string | null {
  const hit = read().find((e) => e.listingId === listingId);
  if (!hit) return null;
  if (Date.now() - hit.at > MAX_AGE_MS) return null;
  return RECENT_CONTACT_NOTICE;
}
