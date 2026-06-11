const VALID_PREFIXES = ["070", "080", "081", "090", "091"] as const;

export function normalizeNigerianPhone(input: string): string {
  return input.replace(/\D/g, "").slice(0, 11);
}

export function isValidNigerianPhone(phone: string): boolean {
  const digits = normalizeNigerianPhone(phone);
  if (digits.length !== 11) return false;
  const prefix = digits.slice(0, 3);
  return VALID_PREFIXES.includes(prefix as (typeof VALID_PREFIXES)[number]);
}

export function canRequestPhoneOtp(phone: string): boolean {
  return isValidNigerianPhone(phone);
}

/** Nigerian local (080…) or intl (+234 / 234…) → 234XXXXXXXXXX for Sendchamp. */
export function toInternationalNigerianPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length === 13) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `234${digits.slice(1)}`;
  return null;
}

/** Display WhatsApp number for verification UI. */
export function formatWhatsappDisplay(input: string): string {
  const intl = toInternationalNigerianPhone(input);
  if (!intl) return input.trim() || "—";
  return `+${intl.slice(0, 3)} ${intl.slice(3, 6)} ${intl.slice(6, 9)} ${intl.slice(9)}`;
}

/** Normalize user input to local 11-digit Nigerian format for storage/API. */
export function normalizeWhatsappInput(input: string): string {
  const intl = toInternationalNigerianPhone(input);
  if (intl) return `0${intl.slice(3)}`;
  return normalizeNigerianPhone(input);
}
