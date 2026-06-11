import { requireServerClient } from "@/lib/supabase/require-client";
import { SiteBannerManager } from "@/components/admin/site-banner-manager";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { parseAdminPage } from "@/lib/admin/pagination";
import type { SiteBanner } from "@/types/database";
import { MOBILE_HEADER_PLACEMENT } from "@/constants/siteBanners";

export default async function AdminBannersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const { page, from, to } = parseAdminPage(sp);
  const supabase = await requireServerClient();

  const { data, count } = await supabase
    .from("site_banners")
    .select("*", { count: "exact" })
    .eq("placement", MOBILE_HEADER_PLACEMENT)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  const total = count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Mobile header banners</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Compact promo strip below the mobile header. {total} banners. Optional
          thumb: design <strong className="text-navy">160×160 px</strong> (1:1)
          — displays at 40×40.
        </p>
        {!isSupabaseConfigured() && (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Supabase env vars required to save banners.
          </p>
        )}
      </div>

      <SiteBannerManager banners={(data ?? []) as SiteBanner[]} />

      <AdminPagination basePath="/lex/auth/banners" total={total} page={page} />
    </div>
  );
}
