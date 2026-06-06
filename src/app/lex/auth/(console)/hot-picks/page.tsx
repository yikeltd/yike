import { requireServerClient } from "@/lib/supabase/require-client";
import { HotPickManager } from "@/components/admin/hot-pick-manager";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { parseAdminPage } from "@/lib/admin/pagination";
import type { Property } from "@/types/database";

type HotPickRow = {
  id: string;
  property_id: string;
  title: string | null;
  badge: string;
  sort_order: number;
  is_active: boolean;
  property: Property | null;
};

export default async function AdminHotPicksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const { page, from, to } = parseAdminPage(sp);
  const supabase = await requireServerClient();

  const { data: picks, count } = await supabase
    .from("home_hot_picks")
    .select(
      `id, property_id, title, badge, sort_order, is_active,
      property:properties (*)`,
      { count: "exact" }
    )
    .order("sort_order", { ascending: true })
    .range(from, to);

  const { data: candidates } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "approved")
    .order("views_count", { ascending: false })
    .limit(20);

  const total = count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Hot picks</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Curate multiple spotlight listings for the home carousel. {total} picks total.
        </p>
        {!isSupabaseConfigured() && (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Supabase env vars required to save hot picks.
          </p>
        )}
      </div>

      <HotPickManager
        picks={(picks ?? []) as unknown as HotPickRow[]}
        candidates={(candidates ?? []) as Property[]}
      />

      <AdminPagination basePath="/lex/auth/hot-picks" total={total} page={page} />
    </div>
  );
}
