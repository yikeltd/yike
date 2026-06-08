import Link from "next/link";
import { EmailTransactionalAdPanel } from "@/components/admin/email-transactional-ad-panel";
import { EMAIL_AD_PLACEMENT_KEY } from "@/lib/email/ad-marker";
import { getPlacementByKey } from "@/lib/ads";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AdminEmailAdsPage() {
  const placement = await getPlacementByKey(EMAIL_AD_PLACEMENT_KEY);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Email ads</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Sponsor chip on all consumer transactional emails. Admin alerts are excluded.
        </p>
        {!isSupabaseConfigured() && (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Supabase env vars required to save email ads.
          </p>
        )}
        {!placement && isSupabaseConfigured() && (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Email placement not seeded yet. Run migration{" "}
            <code className="text-navy">20250718120000_email_ad_placement</code>.
          </p>
        )}
      </div>

      <EmailTransactionalAdPanel placement={placement} />

      <p className="text-sm text-muted">
        Website ad slots (home, search, footer) are still managed on{" "}
        <Link href="/lex/auth/ads" className="font-semibold text-navy underline">
          Ads
        </Link>
        .
      </p>
    </div>
  );
}
