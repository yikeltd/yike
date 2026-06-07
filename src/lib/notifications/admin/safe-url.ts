/** Internal app paths only — blocks external URLs in notification actions. */
export function sanitizeNotificationActionUrl(url: string | null | undefined): string | null {
  const raw = String(url ?? "").trim();
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  if (/^https?:/i.test(raw)) return null;
  if (raw.includes("..")) return null;
  return raw.slice(0, 500);
}
