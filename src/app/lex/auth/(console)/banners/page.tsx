import { requireServerClient } from "@/lib/supabase/require-client";
import { SiteBannerManager } from "@/components/admin/site-banner-manager";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SiteBanner } from "@/types/database";
import { MOBILE_HEADER_PLACEMENT } from "@/constants/siteBanners";

export default async function AdminBannersPage() {
  const supabase = await requireServerClient();

  const { data } = await supabase
    .from("site_banners")
    .select("*")
    .eq("placement", MOBILE_HEADER_PLACEMENT)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Mobile header banners</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Compact promo strip below the mobile header. Desktop never shows these.
          Users can dismiss a banner; it stays hidden until you publish a new one.
        </p>
        {!isSupabaseConfigured() && (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Supabase env vars required to save banners.
          </p>
        )}
      </div>

      <SiteBannerManager banners={(data ?? []) as SiteBanner[]} />
    </div>
  );
}
