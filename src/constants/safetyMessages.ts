export const SAFETY_MESSAGES = [
  "Payment timing is your decision — many renters inspect before large transfers.",
  "Ask for a written fee breakdown when it helps you decide.",
  "Report suspicious listings from the listing page.",
  "Verified means identity checked on Yike — not property title.",
  "Compare multiple listings before you commit.",
  "Keep screenshots of chats and receipts for your records.",
] as const;

/** Stable rotation by day — same message site-wide per day */
export function getDailySafetyMessage(date = new Date()): string {
  const day = Math.floor(date.getTime() / 86_400_000);
  return SAFETY_MESSAGES[day % SAFETY_MESSAGES.length];
}
