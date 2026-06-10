import { friendlyPublicError, UPLOAD_ERROR_FALLBACK } from "@/lib/copy/public-errors";

/** Map Supabase storage errors to calm agent-facing copy. */
export function friendlyStorageError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("payload too large") || lower.includes("too large")) {
    return "Photo is too large. Try a smaller image.";
  }
  if (lower.includes("invalid") && lower.includes("mime")) {
    return "This photo format is not supported. Please upload JPG, PNG, or WebP.";
  }
  return friendlyPublicError(message, UPLOAD_ERROR_FALLBACK);
}
