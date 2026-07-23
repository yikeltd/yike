import { isUsernameAvailable } from "@/lib/auth/signup-rpc";

const USERNAME_RE = /^[a-z0-9_]{3,24}$/;

/** Derive a username base from a display name (letters/numbers/underscore). */
export function usernameBaseFromFullName(fullName: string): string {
  const cleaned = fullName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 18);

  if (cleaned.length >= 3 && USERNAME_RE.test(cleaned)) return cleaned;
  return `user_${Date.now().toString(36).slice(-6)}`;
}

/**
 * Pick an available username from full name, appending digits if needed.
 * Returns null if availability cannot be checked.
 */
export async function allocateSignupUsername(fullName: string): Promise<string | null> {
  const base = usernameBaseFromFullName(fullName);

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate =
      attempt === 0
        ? base
        : `${base.slice(0, 18)}${Math.floor(100 + Math.random() * 900)}`.slice(0, 24);

    if (!USERNAME_RE.test(candidate)) continue;

    const free = await isUsernameAvailable(candidate);
    if (free === null) return null;
    if (free) return candidate;
  }

  const fallback = `u_${Date.now().toString(36)}`.slice(0, 24);
  const free = await isUsernameAvailable(fallback);
  if (free === null) return null;
  return free ? fallback : null;
}
