/** Parse digits from formatted or raw naira input. */
export function parseNairaAmount(value: string): number | null {
  const cleaned = value.replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
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

/** Keep digits only for controlled state. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}
