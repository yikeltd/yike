/**
 * Vehicle listing draft recovery (localStorage) — mirrors property drafts.
 */

const KEY_PREFIX = "yike_vehicle_draft_v1:";

export type VehicleDraft = {
  savedAt: number;
  data: Record<string, unknown>;
};

export function vehicleDraftKey(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

export function loadVehicleDraft(userId: string): VehicleDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(vehicleDraftKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as VehicleDraft;
  } catch {
    return null;
  }
}

export function saveVehicleDraft(userId: string, data: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const draft: VehicleDraft = { savedAt: Date.now(), data };
  localStorage.setItem(vehicleDraftKey(userId), JSON.stringify(draft));
}

export function clearVehicleDraft(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(vehicleDraftKey(userId));
}

export function vehicleDraftLabel(draft: VehicleDraft): string {
  const title = String(draft.data.title ?? "").trim();
  const make = String(draft.data.make ?? "").trim();
  const model = String(draft.data.model ?? "").trim();
  if (title) return title;
  if (make || model) return [make, model].filter(Boolean).join(" ");
  return "Untitled vehicle draft";
}
