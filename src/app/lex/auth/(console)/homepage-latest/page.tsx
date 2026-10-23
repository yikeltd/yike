import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { HomepageLatestManager } from "@/components/admin/homepage-latest-manager";
import {
  getLatestOnYikeConfig,
  resolveLatestOnYikeFeed,
} from "@/lib/home/latest-on-yike.server";
import { requireServerClient } from "@/lib/supabase/require-client";
import { isSampleListingFixtureEnabled } from "@/lib/sample-listings/flags";

export default async function AdminHomepageLatestPage() {
  const config = await getLatestOnYikeConfig();
  const supabase = await requireServerClient();
  const feed = await resolveLatestOnYikeFeed({
    supabase,
    fetchFailed: false,
    sampleFixtureMode: isSampleListingFixtureEnabled(),
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Latest on Yike"
        description="Control the mixed homepage feed — property, vehicles, and electronics. Only approved, publishable listings appear publicly."
      />
      <HomepageLatestManager
        initialConfig={config}
        initialPreview={feed.items}
        initialMeta={{
          usedSampleFixture: feed.usedSampleFixture,
          unavailableManualCount: feed.unavailableManualCount,
          error: feed.error,
        }}
      />
    </div>
  );
}
