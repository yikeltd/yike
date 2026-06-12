/** First name for email greetings — falls back to username, then "there". */
export function emailGreetingName(
  fullName?: string | null,
  username?: string | null
): string {
  const firstFromName = fullName?.trim().split(/\s+/)[0];
  if (firstFromName) return firstFromName;

  const fromUsername = username?.trim();
  if (fromUsername) return fromUsername;

  return "there";
}
