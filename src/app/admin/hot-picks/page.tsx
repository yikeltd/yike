import { requireServerClient } from "@/lib/supabase/require-client";
import { HotPickManager } from "@/components/admin/hot-pick-manager";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Property } from "@/types/database";

export default async function AdminHotPicksPage() {
  const supabase = await requireServerClient();

  const { data: picks } = await supabase
    .from("home_hot_picks")
    .select(
      `id, property_id, title, badge, sort_order, is_active,
      property:properties (*)`
    )
    .order("sort_order", { ascending: true });

  const { data: candidates } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "approved")
    .order("views_count", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Hot picks</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Curate multiple spotlight listings for the home carousel. They auto-scroll
          right to left when users open the app. Reorder, hide, or remove picks
          anytime.
        </p>
        {!isSupabaseConfigured() && (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Supabase env vars required to save hot picks.
          </p>
        )}
      </div>

      <HotPickManager
        picks={(picks ?? []) as unknown as Parameters<
          typeof HotPickManager
        >[0]["picks"]}
        candidates={(candidates ?? []) as Property[]}
      />
    </div>
  );
}
