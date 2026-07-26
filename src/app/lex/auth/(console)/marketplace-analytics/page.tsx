import { createAdminClient } from "@/lib/supabase/admin";
import { getMarketplaceAnalyticsMetrics } from "@/lib/admin/marketplace-analytics";
import { MarketplaceAnalyticsDashboard } from "@/components/admin/marketplace-analytics-dashboard";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = {
  title: "Marketplace Analytics · Yike Command",
};

export default async function MarketplaceAnalyticsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Supabase env vars required to load marketplace analytics.
      </p>
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Database unavailable — marketplace analytics could not load.
      </p>
    );
  }

  const metrics = await getMarketplaceAnalyticsMetrics(admin);
  return <MarketplaceAnalyticsDashboard metrics={metrics} />;
}
