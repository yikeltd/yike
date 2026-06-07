import { createAdminClient } from "@/lib/supabase/admin";
import { getListingValueDrivers } from "@/lib/value-drivers/service";
import { ListingValueDriversDisplay } from "@/components/property/listing-value-drivers-display";

export async function ListingValueDriversSection({
  listingId,
}: {
  listingId: string;
}) {
  const admin = createAdminClient();
  if (!admin) return null;

  const approved = await getListingValueDrivers(admin, listingId, "approved");
  if (approved.length === 0) return null;

  return (
    <ListingValueDriversDisplay
      drivers={approved.map((d) => ({ key: d.driver_key, label: d.label }))}
    />
  );
}
