import "server-only";

import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_BILLING_TERMS,
  type BillingTerm,
} from "@/lib/subscriptions/billing-terms.shared";

export type { BillingTerm } from "@/lib/subscriptions/billing-terms.shared";
export {
  DEFAULT_BILLING_TERMS,
  calculateSubscriptionBilling,
  findBillingTerm,
  formatBillingOptionSubtitle,
  formatBillingOptionTitle,
  maxBillingDiscount,
  resolveBillingTerm,
} from "@/lib/subscriptions/billing-terms.shared";

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
