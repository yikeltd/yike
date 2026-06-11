/** Human-readable promotion reference for checkout and admin lookup. */
export function generatePromotionReference(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `FP-${ts}-${rand}`;
}
