import { createAdminClient } from "@/lib/supabase/admin";
import { getCeoDashboardMetrics } from "@/lib/admin/ceo-dashboard";
import { CeoDashboard } from "@/components/admin/ceo-dashboard";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function CeoAnalyticsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Supabase env vars required to load analytics.
      </p>
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Database unavailable — analytics could not load.
      </p>
    );
  }

  const metrics = await getCeoDashboardMetrics(admin);
  return <CeoDashboard metrics={metrics} />;
}
