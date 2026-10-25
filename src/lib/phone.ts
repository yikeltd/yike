const VALID_PREFIXES = ["070", "080", "081", "090", "091"] as const;

export type ParsedNigerianPhone = {
  /** Local storage form: 08012345678 */
  local11: string;
  /** Sendchamp / duplicate-check form: 2348012345678 */
  intl13: string;
};

function digitsOnly(input: string): string {
  return input.replace(/\D/g, "");
}

function isValidLocal11(local: string): boolean {
  if (local.length !== 11 || local[0] !== "0") return false;
  const prefix = local.slice(0, 3);
  return (VALID_PREFIXES as readonly string[]).includes(prefix);
}

/**
 * Parse a complete Nigerian mobile number from local (080…), +234, or 234 forms.
 * Ignores spaces, hyphens, and parentheses. Returns null for incomplete or invalid numbers.
 */
export function parseNigerianPhone(input: string): ParsedNigerianPhone | null {
  const digits = digitsOnly(input.trim());
  if (!digits) return null;

  let local11: string | null = null;

  if (digits.startsWith("234")) {
    if (digits.length !== 13) return null;
    local11 = `0${digits.slice(3)}`;
  } else if (digits.length === 11 && digits.startsWith("0")) {
    local11 = digits;
  } else {
    return null;
  }

  if (!isValidLocal11(local11)) return null;

  return {
    local11,
    intl13: `234${local11.slice(1)}`,
  };
}

/** Strip formatting while typing; supports local 11-digit or +234 / 234 international entry. */
export function sanitizeNigerianPhoneFieldInput(input: string): string {
  const trimmed = input.trim();
  const leadPlus = trimmed.startsWith("+");
  const digits = digitsOnly(trimmed);

  if (leadPlus || digits.startsWith("234")) {
    const body = digits.slice(0, 13);
    return leadPlus ? `+${body}` : body;
  }

  return digits.slice(0, 11);
}

/** @deprecated Prefer sanitizeNigerianPhoneFieldInput — digits-only local cap. */
export function digitsOnlyPhoneLocal(input: string, max = 11): string {
  return sanitizeNigerianPhoneFieldInput(input).replace(/\D/g, "").slice(0, max);
}

/** Normalize to local 11-digit form when complete; otherwise strip for in-progress typing. */
export function normalizeNigerianPhone(input: string): string {
  const parsed = parseNigerianPhone(input);
  if (parsed) return parsed.local11;
  return digitsOnly(input).slice(0, 11);
}

export function isValidNigerianPhone(phone: string): boolean {
  return parseNigerianPhone(phone) !== null;
}

export function canRequestPhoneOtp(phone: string): boolean {
  return isValidNigerianPhone(phone);
}

/** Nigerian local, +234, or 234 → 234XXXXXXXXXX for Sendchamp and duplicate checks. */
export function toInternationalNigerianPhone(input: string): string | null {
  return parseNigerianPhone(input)?.intl13 ?? null;
}

/** Display WhatsApp number for verification UI. */
export function formatWhatsappDisplay(input: string): string {
  const intl = toInternationalNigerianPhone(input);
  if (!intl) return input.trim() || "—";
  return `+${intl.slice(0, 3)} ${intl.slice(3, 6)} ${intl.slice(6, 9)} ${intl.slice(9)}`;
}

/** Normalize user input to local 11-digit Nigerian format for storage/API. */
export function normalizeWhatsappInput(input: string): string {
  const parsed = parseNigerianPhone(input);
  if (parsed) return parsed.local11;
  return normalizeNigerianPhone(input);
}

/**
 * Canonical 234XXXXXXXXXX for duplicate checks.
 * Treats 080…, 80… (legacy), +234…, and 234… as the same number when valid.
 */
export function normalizePhoneForDuplicateCheck(input: string): string | null {
  const parsed = parseNigerianPhone(input);
  if (parsed) return parsed.intl13;

  const digits = digitsOnly(input);
  if (digits.length === 10) {
    const local11 = `0${digits}`;
    if (isValidLocal11(local11)) return `234${digits}`;
  }

  return null;
}

/** Basic signup phone format — valid Nigerian mobile after normalization. */
export function isBasicPhoneFormat(input: string): boolean {
  return normalizePhoneForDuplicateCheck(input) !== null;
}

/** Valid Nigerian mobile: 11-digit local or equivalent +234 / 234 (formatting allowed). */
export function isLocalNigerianSignupPhone(input: string): boolean {
  return parseNigerianPhone(input) !== null;
}
