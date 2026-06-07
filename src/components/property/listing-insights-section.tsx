import { createAdminClient } from "@/lib/supabase/admin";
import { getListingInsightSummary } from "@/lib/listing-history/summary";
import { ListingInsightsCard } from "@/components/property/listing-insights-card";
import type { Profile, Property } from "@/types/database";

export async function ListingInsightsSection({
  property,
  agent,
}: {
  property: Property;
  agent?: Profile | null;
}) {
  const admin = createAdminClient();
  if (!admin) return null;

  const summary = await getListingInsightSummary(admin, property, agent);
  if (summary.publicSignals.length === 0) return null;

  return (
    <ListingInsightsCard
      listingId={property.id}
      signals={summary.publicSignals}
    />
  );
}
