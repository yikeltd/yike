import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isProductionEnv } from "@/lib/env";
import { MOCK_LISTINGS } from "@/lib/mock-listings";
import { isTrustVerified } from "@/lib/hub-filters";

export type AboutMarketPulse = {
  activeListings: number;
  verifiedAgents: number;
  citiesOnYike: number;
  whatsappConnections: number;
};

const EMPTY_PULSE: AboutMarketPulse = {
  activeListings: 0,
  verifiedAgents: 0,
  citiesOnYike: 0,
  whatsappConnections: 0,
};

export function getDemoAboutMarketPulse(): AboutMarketPulse {
  const cities = new Set(MOCK_LISTINGS.map((p) => p.city));
  const verifiedAgents = new Set(
    MOCK_LISTINGS.filter((p) => isTrustVerified(p) && p.agent?.id).map(
      (p) => p.agent!.id
    )
  ).size;
  const whatsappConnections = MOCK_LISTINGS.reduce(
    (sum, p) => sum + (p.contact_clicks ?? 0),
    0
  );

  return {
    activeListings: MOCK_LISTINGS.length,
    verifiedAgents: Math.max(verifiedAgents, 8),
    citiesOnYike: cities.size,
    whatsappConnections: Math.max(whatsappConnections, 120),
  };
}

export async function getAboutMarketPulse(): Promise<AboutMarketPulse> {
  if (!isSupabaseConfigured()) {
    return isProductionEnv() ? EMPTY_PULSE : getDemoAboutMarketPulse();
  }

  const supabase = await createClient();
  if (!supabase) {
    return isProductionEnv() ? EMPTY_PULSE : getDemoAboutMarketPulse();
  }

  const now = new Date().toISOString();

  const [listingsRes, agentsRes, citiesRes, clicksRes] = await Promise.all([
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .gt("expires_at", now),
    supabase
      .from("agent_verifications")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase.from("properties").select("city").eq("status", "approved").limit(500),
    supabase
      .from("properties")
      .select("contact_clicks")
      .eq("status", "approved")
      .limit(1000),
  ]);

  const cities = new Set(
    (citiesRes.data ?? []).map((row) => row.city as string).filter(Boolean)
  );
  const whatsappConnections = (clicksRes.data ?? []).reduce(
    (sum, row) => sum + ((row.contact_clicks as number) ?? 0),
    0
  );

  const pulse: AboutMarketPulse = {
    activeListings: listingsRes.count ?? 0,
    verifiedAgents: agentsRes.count ?? 0,
    citiesOnYike: cities.size,
    whatsappConnections,
  };

  if (pulse.activeListings === 0 && !isProductionEnv()) {
    return getDemoAboutMarketPulse();
  }
  return pulse;
}
