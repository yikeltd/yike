export const SAFETY_MESSAGES = [
  "Never pay inspection fees before seeing a property.",
  "Meet agents in public first when possible.",
  "Report suspicious listings immediately.",
  "Yike only verifies identity, not ownership yet.",
  "Avoid pressure payments.",
  "Meet at the property, verify documents, and pay only after you are satisfied.",
] as const;

/** Stable rotation by day — same message site-wide per day */
export function getDailySafetyMessage(date = new Date()): string {
  const day = Math.floor(date.getTime() / 86_400_000);
  return SAFETY_MESSAGES[day % SAFETY_MESSAGES.length];
}
