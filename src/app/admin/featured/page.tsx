import { requireServerClient } from "@/lib/supabase/require-client";
import { ListingActions } from "@/components/admin/listing-actions";
import { FeaturedBadge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import type { Property } from "@/types/database";

export default async function AdminFeaturedPage() {
  const supabase = await requireServerClient();
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("is_featured", true)
    .order("created_at", { ascending: false });

  const { data: candidates } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "approved")
    .eq("is_featured", false)
    .order("views_count", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold">Featured listings</h1>
        <ul className="mt-4 space-y-3">
          {(data ?? []).map((p) => {
            const property = p as Property;
            return (
              <li
                key={property.id}
                className="flex items-center justify-between rounded-xl border bg-white p-4"
              >
                <div>
                  <FeaturedBadge />
                  <p className="mt-1 font-medium">{property.title}</p>
                  <p className="text-sm text-muted">
                    {formatPrice(
                      Number(property.price),
                      property.payment_period,
                      property.listing_type
                    )}
                  </p>
                </div>
                <ListingActions propertyId={property.id} />
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Top candidates to feature</h2>
        <ul className="mt-4 space-y-3">
          {(candidates ?? []).map((p) => {
            const property = p as Property;
            return (
              <li
                key={property.id}
                className="rounded-xl border bg-white p-4"
              >
                <p className="font-medium">{property.title}</p>
                <p className="text-xs text-muted">
                  {property.views_count} views
                </p>
                <div className="mt-2">
                  <ListingActions propertyId={property.id} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
