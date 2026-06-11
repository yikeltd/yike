import { requireAuth } from "@/lib/auth";
import { requireServerClient } from "@/lib/supabase/require-client";
import { AgentListingsClient } from "@/components/agent/agent-listings-client";
import {
  isFeaturedListingsEnabled,
  isFeaturedPaymentsEnabled,
} from "@/lib/feature-flags";
import { isPaystackConfigured } from "@/lib/payments/config";
import type { ListingPromotion, Property } from "@/types/database";

export default async function AgentListingsPage() {
  const user = await requireAuth("/auth/login?next=/agent/listings");
  const supabase = await requireServerClient();
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false });

  const { data: promotions } = await supabase
    .from("listing_promotions")
    .select("id, listing_id, promotion_type, status, expires_at, starts_at")
    .eq("user_id", user.id)
    .in("status", ["pending", "paid", "active"])
    .order("created_at", { ascending: false });

  const featuredByListing: Record<string, ListingPromotion> = {};
  const boostByListing: Record<string, ListingPromotion> = {};
  for (const row of promotions ?? []) {
    const promo = row as ListingPromotion;
    if (promo.promotion_type === "boost") {
      if (!boostByListing[promo.listing_id]) boostByListing[promo.listing_id] = promo;
    } else if (!featuredByListing[promo.listing_id]) {
      featuredByListing[promo.listing_id] = promo;
    }
  }

  return (
    <AgentListingsClient
      agentId={user.id}
      listings={(data ?? []) as Property[]}
      featuredByListing={featuredByListing}
      boostByListing={boostByListing}
      featuredListingsEnabled={isFeaturedListingsEnabled()}
      featuredPaymentsEnabled={isFeaturedPaymentsEnabled() && isPaystackConfigured()}
    />
  );
}
