/** Map Supabase storage errors to calm agent-facing copy. */
export function friendlyStorageError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("bucket not found") || lower.includes("bucket_not_found")) {
    return "Photo storage is being prepared. Please try again shortly.";
  }
  if (lower.includes("payload too large") || lower.includes("too large")) {
    return "Photo is too large. Try a smaller image.";
  }
  if (lower.includes("invalid") && lower.includes("mime")) {
    return "This photo format is not supported. Please upload JPEG or PNG.";
  }
  return message || "Upload failed — try again";
}
