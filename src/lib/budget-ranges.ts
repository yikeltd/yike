import type { ThemedSelectOption } from "@/components/ui/themed-select";

export type BudgetRange = {
  label: string;
  min: number;
  max: number | null;
};

/** rent = annual/yearly tiers · sale = buy/land/investment · shortlet = per day */
export type BudgetContext = "rent" | "sale" | "shortlet";

const RENT_TIERS: BudgetRange[] = [
  { label: "Under ₦500K/yr", min: 0, max: 500_000 },
  { label: "₦500K – ₦1M/yr", min: 500_000, max: 1_000_000 },
  { label: "₦1M – ₦3M/yr", min: 1_000_000, max: 3_000_000 },
  { label: "₦3M – ₦5M/yr", min: 3_000_000, max: 5_000_000 },
  { label: "₦5M – ₦10M/yr", min: 5_000_000, max: 10_000_000 },
  { label: "₦10M – ₦20M/yr", min: 10_000_000, max: 20_000_000 },
  { label: "₦20M – ₦50M/yr", min: 20_000_000, max: 50_000_000 },
  { label: "₦50M – ₦100M/yr", min: 50_000_000, max: 100_000_000 },
  { label: "₦100M – ₦500M/yr", min: 100_000_000, max: 500_000_000 },
  { label: "₦500M+/yr", min: 500_000_000, max: null },
];

const SALE_TIERS: BudgetRange[] = [
  { label: "Under ₦5M", min: 0, max: 5_000_000 },
  { label: "₦5M – ₦10M", min: 5_000_000, max: 10_000_000 },
  { label: "₦10M – ₦20M", min: 10_000_000, max: 20_000_000 },
  { label: "₦20M – ₦50M", min: 20_000_000, max: 50_000_000 },
  { label: "₦50M – ₦100M", min: 50_000_000, max: 100_000_000 },
  { label: "₦100M – ₦250M", min: 100_000_000, max: 250_000_000 },
  { label: "₦250M – ₦500M", min: 250_000_000, max: 500_000_000 },
  { label: "₦500M – ₦1B", min: 500_000_000, max: 1_000_000_000 },
  { label: "₦1B+", min: 1_000_000_000, max: null },
];

const SHORTLET_TIERS: BudgetRange[] = [
  { label: "Under ₦50K/day", min: 0, max: 50_000 },
  { label: "₦50K – ₦100K/day", min: 50_000, max: 100_000 },
  { label: "₦100K – ₦250K/day", min: 100_000, max: 250_000 },
  { label: "₦250K – ₦500K/day", min: 250_000, max: 500_000 },
  { label: "₦500K+/day", min: 500_000, max: null },
];

const ANY_BUDGET: BudgetRange = { label: "Any budget", min: 0, max: null };

/** Legacy export — annual rent tiers incl. “Any budget”. */
export const RENT_BUDGET_RANGES: BudgetRange[] = [ANY_BUDGET, ...RENT_TIERS];

/** @deprecated Use getBudgetRangesForContext — kept for legacy forms. */
export const BUDGET_RANGES = RENT_BUDGET_RANGES;

const CONTEXT_SECTION: Record<
  BudgetContext,
  { popular: string; all: string }
> = {
  rent: { popular: "Popular rent ranges", all: "All rent ranges" },
  sale: { popular: "Investment budgets", all: "All purchase ranges" },
  shortlet: { popular: "Daily rates", all: "All shortlet rates" },
};

export function getBudgetTiersForContext(context: BudgetContext): BudgetRange[] {
  switch (context) {
    case "sale":
      return SALE_TIERS;
    case "shortlet":
      return SHORTLET_TIERS;
    default:
      return RENT_TIERS;
  }
}

export function getBudgetRangesForContext(context: BudgetContext): BudgetRange[] {
  return [ANY_BUDGET, ...getBudgetTiersForContext(context)];
}

export function budgetContextFromDealKey(dealKey: string): BudgetContext {
  if (dealKey === "land" || dealKey === "sale") return "sale";
  if (dealKey === "shortlet") return "shortlet";
  return "rent";
}

export function budgetContextFromSearchParams(params: {
  type?: string | null;
  hub?: string | null;
  listingType?: string | null;
}): BudgetContext {
  const type = params.type ?? params.listingType ?? "";
  if (params.hub === "land_sale") return "sale";
  if (type === "sale" || type === "lease") return "sale";
  if (type === "shortlet") return "shortlet";
  return "rent";
}

/** Encoded select value — `min|max`, empty parts = open bound. */
export function encodeBudgetValue(
  min: number | null | undefined,
  max: number | null | undefined
): string {
  if ((min == null || min <= 0) && (max == null || max <= 0)) return "";
  const minPart = min != null && min > 0 ? String(min) : "";
  const maxPart = max != null ? String(max) : "";
  return `${minPart}|${maxPart}`;
}

export function budgetParamsFromValue(value: string): {
  min: string | null;
  max: string | null;
} {
  if (!value || value === "0") return { min: null, max: null };

  if (!value.includes("|")) {
    const idx = Number(value);
    if (!Number.isNaN(idx)) return budgetParamsFromIndex(idx);
  }

  const [minS, maxS] = value.split("|");
  return {
    min: minS && Number(minS) > 0 ? minS : null,
    max: maxS || null,
  };
}

export function budgetValueFromSearchParams(
  min: string | null | undefined,
  max: string | null | undefined
): string {
  const hasMin = min != null && min !== "";
  const hasMax = max != null && max !== "";
  if (!hasMin && !hasMax) return "";

  const minN = hasMin ? Number(min) : 0;
  const maxN = hasMax ? Number(max) : null;
  if (Number.isNaN(minN) || (maxN != null && Number.isNaN(maxN))) return "";

  return encodeBudgetValue(hasMin && minN > 0 ? minN : null, maxN);
}

export function budgetValueMatchesContext(
  value: string,
  context: BudgetContext
): boolean {
  if (!value) return true;
  const { min, max } = budgetParamsFromValue(value);
  const minN = min ? Number(min) : 0;
  const maxN = max ? Number(max) : null;
  return getBudgetTiersForContext(context).some(
    (r) => r.min === minN && r.max === maxN
  );
}

export function budgetLabelFromValue(
  value: string,
  context: BudgetContext = "rent"
): string | null {
  if (!value) return null;
  const { min, max } = budgetParamsFromValue(value);
  const minN = min ? Number(min) : 0;
  const maxN = max ? Number(max) : null;
  const match = getBudgetRangesForContext(context).find(
    (r) => r.min === minN && r.max === maxN
  );
  return match?.label ?? null;
}

/** @deprecated Prefer budgetValueFromSearchParams + budgetParamsFromValue. */
export function budgetIndexFromSearchParams(
  min: string | null | undefined,
  max: string | null | undefined
): number {
  const hasMin = min != null && min !== "";
  const hasMax = max != null && max !== "";
  if (!hasMin && !hasMax) return 0;

  const minN = hasMin ? Number(min) : null;
  const maxN = hasMax ? Number(max) : null;

  const idx = RENT_BUDGET_RANGES.findIndex((b, i) => {
    if (i === 0) return false;
    const minOk = minN != null ? b.min === minN : b.min === 0;
    const maxOk = maxN != null ? b.max === maxN : b.max == null;
    return minOk && maxOk;
  });
  return idx >= 0 ? idx : 0;
}

/** @deprecated Prefer budgetParamsFromValue. */
export function budgetParamsFromIndex(index: number): {
  min: string | null;
  max: string | null;
} {
  if (index <= 0) return { min: null, max: null };
  const range = RENT_BUDGET_RANGES[index];
  if (!range) return { min: null, max: null };
  return {
    min: range.min > 0 ? String(range.min) : null,
    max: range.max != null ? String(range.max) : null,
  };
}

export function budgetLabelFromSearchParams(
  min: string | null | undefined,
  max: string | null | undefined,
  context: BudgetContext = "rent"
): string | null {
  return budgetLabelFromValue(
    budgetValueFromSearchParams(min, max),
    context
  );
}

function buildGroupedBudgetOptions(
  context: BudgetContext,
  opts?: { includePlaceholder?: boolean }
): ThemedSelectOption[] {
  const tiers = getBudgetTiersForContext(context);
  const sections = CONTEXT_SECTION[context];
  const all = tiers.map((r) => ({
    value: encodeBudgetValue(r.min > 0 ? r.min : null, r.max),
    label: r.label,
  }));

  const items: ThemedSelectOption[] = [];
  if (opts?.includePlaceholder !== false) {
    items.push({ value: "", label: "Any budget" });
  }
  items.push(
    { kind: "header", id: "popular", label: sections.popular },
    ...all
  );

  return items;
}

/** Search refine filters — includes “Any budget”. */
export function buildBudgetSelectOptions(
  context: BudgetContext = "rent"
): ThemedSelectOption[] {
  return buildGroupedBudgetOptions(context, { includePlaceholder: true });
}

/** Homepage hero — placeholder on trigger, tiers only in list. */
export function buildBudgetHeroSelectOptions(
  context: BudgetContext = "rent"
): ThemedSelectOption[] {
  return buildGroupedBudgetOptions(context, { includePlaceholder: false });
}

/** Legacy flat options for native &lt;select&gt; elements. */
export function budgetNativeSelectOptions(context: BudgetContext = "rent") {
  return getBudgetRangesForContext(context).map((b) => ({
    value: encodeBudgetValue(b.min > 0 ? b.min : null, b.max),
    label: b.label,
  }));
}

export function budgetSelectOptions() {
  return budgetNativeSelectOptions("rent");
}

export function budgetHeroSelectOptions() {
  return getBudgetTiersForContext("rent").map((b) => ({
    value: encodeBudgetValue(b.min > 0 ? b.min : null, b.max),
    label: b.label,
  }));
}
