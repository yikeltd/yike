import { requireServerClient } from "@/lib/supabase/require-client";
import { notFound } from "next/navigation";
import { AdminAgentProfile } from "@/components/admin/admin-agent-profile";
import { countAsActiveListing } from "@/lib/agent-tiers";
import type { Profile } from "@/types/database";

export default async function AdminAgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await requireServerClient();

  const { data: agent } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!agent) notFound();

  const [{ data: listings }, { count: leadCount }, { count: reviewCount }] =
    await Promise.all([
      supabase.from("properties").select("id, status, expires_at").eq("agent_id", id),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", id),
      supabase
        .from("agent_reviews")
        .select("id", { count: "exact", head: true })
        .or(`agent_id.eq.${id},company_id.eq.${id}`),
    ]);

  const activeListingCount = (listings ?? []).filter((p) =>
    countAsActiveListing(p.status, p.expires_at)
  ).length;

  const { data: verification } = await supabase
    .from("agent_verifications")
    .select("id, status")
    .eq("agent_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <AdminAgentProfile
      agent={agent as Profile}
      stats={{
        active_listing_count: activeListingCount,
        total_listings: listings?.length ?? 0,
        leads: leadCount ?? 0,
        reviews: reviewCount ?? 0,
        reports: 0,
      }}
      verification={verification}
    />
  );
}
