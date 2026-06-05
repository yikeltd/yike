import { getAllAdPlacements } from "@/lib/ads";
import { AdPlacementForm } from "@/components/admin/ad-placement-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AdminAdsPage() {
  const placements = await getAllAdPlacements();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">Ad placements</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Fill each slot with an image and optional link. Ads go live only when
          you tick &quot;Show on website&quot; and save. All units are labelled
          Sponsored on the public site.
        </p>
        {!isSupabaseConfigured() && (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Supabase env vars required to save ads.
          </p>
        )}
      </div>

      {placements.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-sm text-muted shadow-float">
          No ad slots found. Run the latest Supabase migration{" "}
          <code className="text-navy">20250605140000_ad_placements</code> to
          seed placement keys.
        </p>
      ) : (
        placements.map((p) => <AdPlacementForm key={p.id} placement={p} />)
      )}
    </div>
  );
}
