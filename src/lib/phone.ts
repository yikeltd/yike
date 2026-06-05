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
