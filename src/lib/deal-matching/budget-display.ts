/** Public-safe budget copy — never expose exact figures to agents. */

function formatNgnRange(min: number, max: number): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(n);

  if (min === max) return fmt(min);
  return `${fmt(min)} – ${fmt(max)}`;
}

function roundToBucket(n: number): number {
  if (n >= 100_000_000) return Math.round(n / 10_000_000) * 10_000_000;
  if (n >= 10_000_000) return Math.round(n / 1_000_000) * 1_000_000;
  if (n >= 1_000_000) return Math.round(n / 500_000) * 500_000;
  return Math.round(n / 100_000) * 100_000;
}

export function publicBudgetLabel(
  budgetMin: number | null | undefined,
  budgetMax: number | null | undefined
): string | null {
  if (budgetMin == null && budgetMax == null) return null;

  const min = budgetMin ?? budgetMax ?? 0;
  const max = budgetMax ?? budgetMin ?? min;

  if (min <= 0 && max <= 0) return null;

  const roundedMin = roundToBucket(Math.min(min, max));
  const roundedMax = roundToBucket(Math.max(min, max));

  if (roundedMin === roundedMax) {
    return `Premium budget around ${formatNgnRange(roundedMin, roundedMax)}`;
  }

  return `Budget range ${formatNgnRange(roundedMin, roundedMax)}`;
}

export function internalBudgetLabel(
  budgetMin: number | null | undefined,
  budgetMax: number | null | undefined
): string {
  if (budgetMin == null && budgetMax == null) return "Not set";
  const min = budgetMin ?? 0;
  const max = budgetMax ?? min;
  if (min === max) return formatNgnRange(min, max);
  return formatNgnRange(min, max);
}
