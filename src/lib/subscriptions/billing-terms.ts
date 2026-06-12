import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUBSCRIPTION_DURATION_DAYS } from "@/lib/subscriptions/constants";

export type BillingTerm = {
  id: string;
  months: number;
  label: string;
  shortLabel: string;
  discountPercent: number;
  active: boolean;
  sortOrder: number;
};

export const DEFAULT_BILLING_TERMS: BillingTerm[] = [
  { id: "default-1", months: 1, label: "1 month", shortLabel: "Monthly", discountPercent: 0, active: true, sortOrder: 10 },
  { id: "default-3", months: 3, label: "3 months", shortLabel: "3 Months", discountPercent: 10, active: true, sortOrder: 20 },
  { id: "default-6", months: 6, label: "6 months", shortLabel: "6 Months", discountPercent: 20, active: true, sortOrder: 30 },
  { id: "default-12", months: 12, label: "12 months", shortLabel: "12 Months", discountPercent: 30, active: true, sortOrder: 40 },
];

/** Consistent billing chip title (web + mobile). */
export function formatBillingOptionTitle(term: BillingTerm): string {
  if (term.months === 1) return "Monthly";
  if (term.months === 3) return "3 Months";
  if (term.months === 6) return "6 Months";
  if (term.months === 12) return "12 Months";
  return term.label.replace(/\bmonth\b/i, "Months").replace(/\bmo\b/i, "Months");
}

/** Secondary line under billing option title. */
export function formatBillingOptionSubtitle(term: BillingTerm): string {
  if (term.discountPercent > 0) {
    return `Save ${Number.isInteger(term.discountPercent) ? term.discountPercent : term.discountPercent.toFixed(1).replace(/\.0$/, "")}%`;
  }
  return "Standard";
}

function mapBillingTermRow(row: Record<string, unknown>): BillingTerm {
  return {
    id: row.id as string,
    months: Number(row.months),
    label: row.label as string,
    shortLabel: row.short_label as string,
    discountPercent: Number(row.discount_percent ?? 0),
    active: Boolean(row.active),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export async function listBillingTerms(
  admin: SupabaseClient,
  options?: { includeInactive?: boolean }
): Promise<BillingTerm[]> {
  let query = admin
    .from("subscription_billing_terms")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("months", { ascending: true });

  if (!options?.includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[billing-terms] load failed:", error.message);
    return DEFAULT_BILLING_TERMS.filter((term) => options?.includeInactive || term.active);
  }
  const mapped = (data ?? []).map((row) => mapBillingTermRow(row as Record<string, unknown>));
  return mapped.length ? mapped : DEFAULT_BILLING_TERMS.filter((term) => options?.includeInactive || term.active);
}

export const getCachedPublicBillingTerms = unstable_cache(
  async () => {
    const { tryCreateAdminClient } = await import("@/lib/supabase/admin");
    const admin = tryCreateAdminClient();
    if (!admin) return DEFAULT_BILLING_TERMS;
    return listBillingTerms(admin, { includeInactive: false });
  },
  ["subscription-billing-terms-public"],
  { revalidate: 60, tags: ["revenue-pricing", "subscription-billing-terms"] }
);

export function findBillingTerm(terms: BillingTerm[], months: number): BillingTerm | null {
  return terms.find((term) => term.months === months && term.active) ?? null;
}

export function resolveBillingTerm(
  terms: BillingTerm[],
  months: number
): BillingTerm {
  return findBillingTerm(terms, months) ?? terms[0] ?? DEFAULT_BILLING_TERMS[0];
}

export function calculateSubscriptionBilling(
  monthlyPrice: number,
  months: number,
  terms: BillingTerm[] = DEFAULT_BILLING_TERMS
) {
  const term = resolveBillingTerm(terms, months);
  const subtotal = monthlyPrice * term.months;
  const total = Math.round(subtotal * (1 - term.discountPercent / 100));
  const savings = subtotal - total;
  const durationDays = term.months * SUBSCRIPTION_DURATION_DAYS;

  return {
    months: term.months,
    discountPercent: term.discountPercent,
    subtotal,
    total,
    savings,
    durationDays,
    effectiveMonthly: Math.round(total / term.months),
  };
}

export function maxBillingDiscount(terms: BillingTerm[]): number {
  return terms.reduce((max, term) => Math.max(max, term.discountPercent), 0);
}
