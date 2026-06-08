import { BUDGET_RANGES } from "@/lib/constants";

export { BUDGET_RANGES };

export function budgetSelectOptions() {
  return BUDGET_RANGES.map((b, i) => ({
    value: String(i),
    label: b.label,
  }));
}

/** Homepage hero — formatted ₦ tiers (trigger placeholder = “Any budget”). */
export function budgetHeroSelectOptions() {
  return BUDGET_RANGES.slice(1).map((b, i) => ({
    value: String(i + 1),
    label: b.label,
  }));
}

/** Map URL min/max query params to a BUDGET_RANGES index. */
export function budgetIndexFromSearchParams(
  min: string | null | undefined,
  max: string | null | undefined
): number {
  const hasMin = min != null && min !== "";
  const hasMax = max != null && max !== "";
  if (!hasMin && !hasMax) return 0;

  const minN = hasMin ? Number(min) : null;
  const maxN = hasMax ? Number(max) : null;

  const idx = BUDGET_RANGES.findIndex((b, i) => {
    if (i === 0) return false;
    const minOk = minN != null ? b.min === minN : b.min === 0;
    const maxOk = maxN != null ? b.max === maxN : b.max == null;
    return minOk && maxOk;
  });
  return idx >= 0 ? idx : 0;
}

export function budgetParamsFromIndex(index: number): {
  min: string | null;
  max: string | null;
} {
  if (index <= 0) return { min: null, max: null };
  const range = BUDGET_RANGES[index];
  if (!range) return { min: null, max: null };
  return {
    min: range.min > 0 ? String(range.min) : null,
    max: range.max != null ? String(range.max) : null,
  };
}

export function budgetLabelFromSearchParams(
  min: string | null | undefined,
  max: string | null | undefined
): string | null {
  const idx = budgetIndexFromSearchParams(min, max);
  if (idx === 0) return null;
  return BUDGET_RANGES[idx]?.label ?? null;
}
