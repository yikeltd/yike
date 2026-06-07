import { requireServerClient } from "@/lib/supabase/require-client";
import { PromoBannerManager } from "@/components/admin/promo-banner-manager";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SiteBanner } from "@/types/database";

export default async function PromoBannersPage() {
  const supabase = await requireServerClient();
  const { data } = await supabase
    .from("site_banners")
    .select("*")
    .order("placement")
    .order("priority", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Promo banners</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Admin-controlled verification flyers and promos — placement, schedule, CTA, and destination.
        </p>
        {!isSupabaseConfigured() ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Supabase env vars required.
          </p>
        ) : null}
      </div>
      <PromoBannerManager banners={(data ?? []) as SiteBanner[]} />
    </div>
  );
}
