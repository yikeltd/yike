import { createAdminClient } from "@/lib/supabase/admin";

export type LeadDailySummary = {
  leadsToday: number;
  leadsWeek: number;
  directLeads: number;
  conciergeLeads: number;
  duplicatesBlocked: number;
  spamMarked: number;
  chargeableLeads: number;
  estimatedRevenue: number;
  topAgents: { agent_id: string; full_name: string | null; count: number }[];
  topListings: { listing_id: string; title: string | null; count: number }[];
};

export async function getLeadDailySummary(): Promise<LeadDailySummary | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now.getTime() - 7 * 86_400_000);

  const { data: weekLeads } = await admin
    .from("leads")
    .select(
      `id, agent_id, listing_id, clicked_at, route_to, is_duplicate,
       lead_quality_label, charge_status, charge_amount,
       agent:profiles!leads_agent_id_fkey (full_name),
       listing:properties!leads_listing_id_fkey (title)`
    )
    .gte("clicked_at", weekStart.toISOString())
    .order("clicked_at", { ascending: false });

  const rows = weekLeads ?? [];
  const todayIso = todayStart.toISOString();

  const todayRows = rows.filter((r) => r.clicked_at >= todayIso);

  const agentCounts = new Map<string, { name: string | null; count: number }>();
  const listingCounts = new Map<string, { title: string | null; count: number }>();

  for (const r of todayRows) {
    const agentRaw = r.agent;
    const listingRaw = r.listing;
    const agent = (Array.isArray(agentRaw) ? agentRaw[0] : agentRaw) as {
      full_name: string | null;
    } | null;
    const listing = (Array.isArray(listingRaw) ? listingRaw[0] : listingRaw) as {
      title: string | null;
    } | null;

    const ac = agentCounts.get(r.agent_id) ?? { name: agent?.full_name ?? null, count: 0 };
    ac.count += 1;
    agentCounts.set(r.agent_id, ac);

    const lc = listingCounts.get(r.listing_id) ?? {
      title: listing?.title ?? null,
      count: 0,
    };
    lc.count += 1;
    listingCounts.set(r.listing_id, lc);
  }

  const topAgents = [...agentCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([agent_id, v]) => ({
      agent_id,
      full_name: v.name,
      count: v.count,
    }));

  const topListings = [...listingCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([listing_id, v]) => ({
      listing_id,
      title: v.title,
      count: v.count,
    }));

  let estimatedRevenue = 0;
  for (const r of rows) {
    if (r.charge_status === "charged" && r.charge_amount) {
      estimatedRevenue += Number(r.charge_amount);
    }
  }

  return {
    leadsToday: todayRows.length,
    leadsWeek: rows.length,
    directLeads: rows.filter((r) => r.route_to === "direct_agent").length,
    conciergeLeads: rows.filter((r) => r.route_to === "yike_support").length,
    duplicatesBlocked: rows.filter((r) => r.is_duplicate).length,
    spamMarked: rows.filter((r) => r.lead_quality_label === "spam").length,
    chargeableLeads: rows.filter(
      (r) =>
        r.charge_status === "charged" ||
        r.charge_status === "pending" ||
        (r.charge_amount && Number(r.charge_amount) > 0)
    ).length,
    estimatedRevenue,
    topAgents,
    topListings,
  };
}
