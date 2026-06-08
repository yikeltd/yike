/** Patterns that must never reach end users. */
const TECHNICAL_MARKERS = [
  "bucket not found",
  "bucket_not_found",
  "supabase",
  "service role",
  "rpc failed",
  "database unavailable",
  "auth unavailable",
  "auth service unavailable",
  "provider failed",
  "postgresql",
  "pgrst",
  "row level security",
  "internal server error",
  "fetch failed",
  "econnrefused",
  "network request failed",
];

const UPLOAD_FALLBACK = "We couldn't upload this right now. Please try again.";
const GENERIC_FALLBACK = "Something went wrong. Please try again.";

/** Map raw API / provider errors to calm public copy. */
export function friendlyPublicError(
  message: string | null | undefined,
  fallback: string = GENERIC_FALLBACK
): string {
  if (!message?.trim()) return fallback;
  const lower = message.toLowerCase();

  if (TECHNICAL_MARKERS.some((m) => lower.includes(m))) {
    if (lower.includes("bucket") || lower.includes("storage")) return UPLOAD_FALLBACK;
    if (lower.includes("too large") || lower.includes("payload")) {
      return "This file is too large. Try a smaller one.";
    }
    return fallback;
  }

  if (message.length > 140) return fallback;
  return message;
}

export const PUBLIC_ERROR_FALLBACK = GENERIC_FALLBACK;
export const UPLOAD_ERROR_FALLBACK = UPLOAD_FALLBACK;
