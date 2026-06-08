const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidWorkEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_RE.test(trimmed)) return false;
  return trimmed.endsWith("@yike.ng");
}

export function normalizeWorkEmail(email: string): string {
  return email.trim().toLowerCase();
}
