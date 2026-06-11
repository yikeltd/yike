import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getRevenuePrice } from "@/lib/revenue-pricing/service";
import type { PropertyVerificationPackageId } from "@/lib/property-verification/packages";

export async function packageAmount(
  admin: SupabaseClient,
  id: PropertyVerificationPackageId
): Promise<number | null> {
  return getRevenuePrice(admin, "property_verification", id);
}
