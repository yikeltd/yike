import { requireAuth, getOrCreateOwnProfile } from "@/lib/auth";
import {
  canListProperties,
  getListingLimit,
  isVerifiedAgentProfile,
  countAsActiveListing,
} from "@/lib/agent-tiers";
import { isExpiringSoon, isListingExpired } from "@/lib/listing-lifecycle";
import { requireServerClient } from "@/lib/supabase/require-client";
import { ProfilePageClient } from "@/components/profile/profile-page-client";
import type { Property } from "@/types/database";
import { offsetDaysIso } from "@/lib/time";
import { getProfileSocialStats } from "@/lib/social/stats";
import { getActiveUserSubscription } from "@/lib/subscriptions/service";
import { getPlanDisplayLabel } from "@/lib/subscriptions/constants";
import { tryCreateAdminClient } from "@/lib/supabase/admin";

function subscriptionExpiresInDays(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const expiresMs = new Date(iso).getTime();
  if (Number.isNaN(expiresMs)) return null;
  return Math.ceil((expiresMs - Date.now()) / 86_400_000);
}

function formatMemberSince(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-NG", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return "2026";
  }
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireAuth("/auth/login?next=/agent");
  const profile = await getOrCreateOwnProfile(user);
  const supabase = await requireServerClient();
  const { saved } = await searchParams;

  if (!profile) {
    return (
      <p className="pt-8 text-center text-muted">
        Setting up your profile… Refresh if this stays here.
      </p>
    );
  }

  const verified = isVerifiedAgentProfile(profile);
  const canList = canListProperties(profile);
  const limit = getListingLimit(profile);

  const admin = tryCreateAdminClient();
  const [
    { data: listings },
    { count: savedCount },
    { count: leadsCount },
    { count: verificationCount },
    socialStats,
    activeSubscription,
  ] = await Promise.all([
      supabase
        .from("properties")
        .select(
          "status, expires_at, media_urls, listing_health_score, hidden_quality_score, image_quality_score, listing_quality_flags"
        )
        .eq("agent_id", user.id),
      supabase
        .from("favorites")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      canList
        ? supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .eq("agent_id", user.id)
            .gte("created_at", offsetDaysIso(-30))
        : Promise.resolve({ count: 0 }),
      supabase
        .from("property_verification_requests")
        .select("id", { count: "exact", head: true })
        .eq("requester_user_id", user.id),
      getProfileSocialStats(supabase, user.id),
      admin ? getActiveUserSubscription(admin, user.id) : Promise.resolve(null),
    ]);

  type AccountListingRow = Pick<
    Property,
    | "status"
    | "expires_at"
    | "media_urls"
    | "listing_health_score"
    | "hidden_quality_score"
    | "image_quality_score"
    | "listing_quality_flags"
  >;
  const rows = (listings ?? []) as AccountListingRow[];
  const activeRows = rows.filter((p) => countAsActiveListing(p.status, p.expires_at));
  const activeCount = activeRows.length;
  const pending = rows.filter((p) => p.status === "pending").length;
  const rentedCount = rows.filter((p) => p.status === "rented").length;
  const soldCount = rows.filter((p) => p.status === "archived").length;
  const expiringSoon = rows.filter(
    (p) => p.status === "approved" && isExpiringSoon(p, 3)
  ).length;
  const expiredCount = rows.filter(
    (p) => p.status === "approved" && isListingExpired(p)
  ).length;
  const qualityFlags = (p: AccountListingRow) =>
    Array.isArray(p.listing_quality_flags) ? p.listing_quality_flags : [];
  const missingPhotosCount = activeRows.filter(
    (p) => (p.media_urls ?? []).length < 2 || qualityFlags(p).includes("few_images")
  ).length;
  const incompleteListingsCount = activeRows.filter((p) => {
    const flags = qualityFlags(p);
    return flags.includes("thin_description") || flags.includes("missing_contact");
  }).length;
  const lowQualityListingsCount = activeRows.filter((p) => {
    const score =
      p.listing_health_score ?? p.hidden_quality_score ?? p.image_quality_score ?? null;
    return score != null && score < 65;
  }).length;
  const listingHealthScores = activeRows
    .map((p) => p.listing_health_score)
    .filter((score): score is number => typeof score === "number" && Number.isFinite(score));
  const listingHealthScore =
    listingHealthScores.length > 0
      ? Math.round(
          listingHealthScores.reduce((sum, score) => sum + score, 0) /
            listingHealthScores.length
        )
      : null;

  return (
    <ProfilePageClient
      profile={profile}
      email={user.email ?? profile.email ?? ""}
      canList={canList}
      verified={verified}
      activeCount={activeCount}
      pending={pending}
      totalListings={rows.length}
      limit={limit}
      savedCount={savedCount ?? 0}
      expiringSoon={expiringSoon}
      expiredCount={expiredCount}
      draftCount={0}
      rentedCount={rentedCount}
      soldCount={soldCount}
      leadsCount={leadsCount ?? 0}
      missingPhotosCount={missingPhotosCount}
      incompleteListingsCount={incompleteListingsCount}
      lowQualityListingsCount={lowQualityListingsCount}
      listingHealthScore={listingHealthScore}
      verificationRequestsCount={verificationCount ?? 0}
      memberSince={formatMemberSince(profile.created_at)}
      socialStats={socialStats}
      subscriptionPlanLabel={
        activeSubscription?.plan
          ? getPlanDisplayLabel(activeSubscription.plan.plan_code)
          : null
      }
      subscriptionExpiresInDays={subscriptionExpiresInDays(activeSubscription?.expires_at)}
      foundingMember={profile.founding_member ?? false}
      profileSaved={saved === "profile"}
    />
  );
}
