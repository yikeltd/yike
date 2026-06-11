import { friendlyPublicError, UPLOAD_ERROR_FALLBACK } from "@/lib/copy/public-errors";

const ADMIN_UPLOAD_STORAGE_ERROR =
  "Upload storage is not ready. Please contact technical support.";

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

/** Staff upload surfaces — hide migration hints from admins. */
export function friendlyAdminStorageError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("bucket") || lower.includes("not found")) {
    return ADMIN_UPLOAD_STORAGE_ERROR;
  }
  return friendlyStorageError(message);
}
