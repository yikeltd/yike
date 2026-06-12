/** Parse digits from formatted or raw naira input. */
export function parseNairaAmount(value: string): number | null {
  const digits = digitsOnly(normalizeNairaInput(value));
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Display as 1,234,567.00 */
export function formatNairaAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Comma grouping while typing — no forced decimals. */
export function formatNairaTyping(digits: string): string {
  if (!digits) return "";
  const n = Number(digits);
  if (!Number.isFinite(n)) return digits;
  return n.toLocaleString("en-NG");
}

/** Comma-group integer digits (strips non-digits). */
export function formatIntegerTyping(raw: string): string {
  const digits = digitsOnly(raw);
  if (!digits) return "";
  return formatNairaTyping(digits);
}

/** Comma-group a leading amount; keep trailing text (e.g. /month, per project). */
export function formatSalaryTyping(raw: string): string {
  const match = raw.match(/^[\d,]*/);
  const numRaw = match?.[0] ?? "";
  const suffix = raw.slice(numRaw.length);
  const digits = digitsOnly(numRaw);
  if (!digits && !suffix) return "";
  if (!digits) return raw;
  return `${formatNairaTyping(digits)}${suffix}`;
}

/** Format amount fields that may be plain digits or a percentage. */
export function formatAmountOrPercentTyping(raw: string): string {
  if (raw.includes("%")) return raw;
  return formatSalaryTyping(raw);
}

/** Fee fields — keep letters, %, /, etc. No digit-only stripping while typing. */
export function formatFlexibleFeeTyping(raw: string): string {
  return raw.slice(0, 120);
}

/** Keep digits only for controlled state. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Expand 500k / 2.5m / 1b shorthands; strip commas and spaces. */
export function normalizeNairaInput(raw: string): string {
  const trimmed = raw.trim().replace(/,/g, "").replace(/\s+/g, "");
  if (!trimmed) return "";

  const shorthand = trimmed.match(
    /^(\d+(?:\.\d+)?)(k|thousand|thousands|m|mn|mil|million|millions|b|bn|bil|billion|billions)$/i
  );
  if (shorthand) {
    const num = parseFloat(shorthand[1]);
    if (!Number.isFinite(num) || num <= 0) return digitsOnly(trimmed);
    const suffix = shorthand[2].toLowerCase();
    const mult = ["k", "thousand", "thousands"].includes(suffix)
      ? 1_000
      : ["m", "mn", "mil", "million", "millions"].includes(suffix)
        ? 1_000_000
        : 1_000_000_000;
    return String(Math.round(num * mult));
  }

  return digitsOnly(trimmed);
}
