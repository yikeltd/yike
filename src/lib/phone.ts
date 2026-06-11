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
