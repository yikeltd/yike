/** Canonical username rules for all Yike accounts (not auth credentials). */

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 24;

/** Lowercase alphanumeric + underscore after normalization. */
export const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

const RESERVED_EXACT = new Set([
  "yike",
  "yikehq",
  "yike_ng",
  "admin",
  "administrator",
  "support",
  "help",
  "system",
  "root",
  "null",
  "undefined",
  "moderator",
  "staff",
  "official",
  "verified",
  "security",
  "paystack",
  "lex",
  "api",
  "www",
]);

const RESERVED_PREFIXES = ["yike_", "admin_", "support_", "staff_", "system_"];

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export type UsernameValidationResult =
  | { ok: true; username: string }
  | { ok: false; error: string; code: string };

export function validateUsername(raw: string): UsernameValidationResult {
  const username = normalizeUsername(raw);
  if (!username) {
    return { ok: false, error: "Username is required", code: "required" };
  }
  if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `Username must be ${USERNAME_MIN_LENGTH}–${USERNAME_MAX_LENGTH} characters`,
      code: "length",
    };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return {
      ok: false,
      error: "Use letters, numbers, and underscores only",
      code: "format",
    };
  }
  if (username.startsWith("_") || username.endsWith("_")) {
    return { ok: false, error: "Username cannot start or end with _", code: "format" };
  }
  if (RESERVED_EXACT.has(username)) {
    return { ok: false, error: "This username is reserved", code: "reserved" };
  }
  for (const prefix of RESERVED_PREFIXES) {
    if (username.startsWith(prefix)) {
      return { ok: false, error: "This username is reserved", code: "reserved" };
    }
  }
  return { ok: true, username };
}
