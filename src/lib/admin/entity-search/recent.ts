import type { AdminEntityType } from "./types";

export type RecentEntity = {
  id: string;
  display_name: string;
  subtitle: string;
  image_url: string | null;
};

const STORAGE_PREFIX = "yike-admin-recent-";
const MAX_RECENT = 8;

function storageKey(type: AdminEntityType): string {
  return `${STORAGE_PREFIX}${type}`;
}

export function loadRecentEntities(type: AdminEntityType): RecentEntity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(type));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentEntity[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function saveRecentEntity(
  type: AdminEntityType,
  entity: RecentEntity
): void {
  if (typeof window === "undefined") return;
  const existing = loadRecentEntities(type).filter((e) => e.id !== entity.id);
  const next = [entity, ...existing].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(storageKey(type), JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
}
