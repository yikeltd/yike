import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListingLeadStatus } from "@/lib/listing-leads/constants";
import { getLeadInsightsAccess } from "@/lib/listing-leads/access";
import type { Profile } from "@/types/database";

export type ListingLeadRow = {
  id: string;
  listing_id: string | null;
  seller_id: string;
  lead_user_id: string | null;
  lead_type: string;
  status: ListingLeadStatus;
  lead_source: string | null;
  quality_score: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  listing?: { id: string; title: string; area: string | null; city: string | null } | null;
  lead_user?: { full_name: string | null; username: string | null } | null;
};

export async function listSellerLeads(
  admin: SupabaseClient,
  sellerId: string,
  options: {
    status?: ListingLeadStatus;
    limit?: number;
    profile: Pick<Profile, "id" | "subscription_plan_code" | "lead_insights_until">;
  }
): Promise<{ leads: ListingLeadRow[]; access: Awaited<ReturnType<typeof getLeadInsightsAccess>> }> {
  const access = await getLeadInsightsAccess(admin, options.profile);
  const limit = access.historyLimit ?? options.limit ?? 200;

  let query = admin
    .from("listing_leads")
    .select("*, listing:properties(id, title, area, city), lead_user:profiles!lead_user_id(full_name, username)")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options.status) query = query.eq("status", options.status);

  const { data } = await query;
  return { leads: (data ?? []) as ListingLeadRow[], access };
}

export async function updateLeadStatus(
  admin: SupabaseClient,
  sellerId: string,
  leadId: string,
  status: ListingLeadStatus
): Promise<boolean> {
  const { error } = await admin
    .from("listing_leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .eq("seller_id", sellerId);

  return !error;
}

export function leadDisplayName(lead: ListingLeadRow): string {
  const meta = lead.metadata ?? {};
  if (typeof meta.lead_display === "string" && meta.lead_display.trim()) {
    return meta.lead_display.trim();
  }
  return lead.lead_user?.full_name?.trim() || lead.lead_user?.username?.trim() || "Yike user";
}
