import { requireAuth, getProfile } from "@/lib/auth";
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

export default async function ProfilePage() {
  const user = await requireAuth("/auth/login?next=/agent");
  const profile = await getProfile(user.id);
  const supabase = await requireServerClient();

  if (!profile) {
    return <p className="pt-8 text-center text-muted">Profile not found.</p>;
  }

  const verified = isVerifiedAgentProfile(profile);
  const canList = canListProperties(profile);
  const limit = getListingLimit(profile);

  const [{ data: listings }, { count: savedCount }, { count: leadsCount }, { count: verificationCount }] =
    await Promise.all([
      supabase
        .from("properties")
        .select("status, expires_at")
        .eq("agent_id", user.id),
      supabase
        .from("favorites")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      canList
        ? supabase
            .from("leads")
            .select("*", { count: "exact", head: true })
            .eq("agent_id", user.id)
            .gte("created_at", new Date(Date.now() - 30 * 86_400_000).toISOString())
        : Promise.resolve({ count: 0 }),
      supabase
        .from("property_verification_requests")
        .select("*", { count: "exact", head: true })
        .eq("requester_user_id", user.id),
    ]);

  const rows = (listings ?? []) as Pick<Property, "status" | "expires_at">[];
  const activeCount = rows.filter((p) =>
    countAsActiveListing(p.status, p.expires_at)
  ).length;
  const pending = rows.filter((p) => p.status === "pending").length;
  const expiringSoon = rows.filter(
    (p) => p.status === "approved" && isExpiringSoon(p, 3)
  ).length;
  const expiredCount = rows.filter(
    (p) => p.status === "approved" && isListingExpired(p)
  ).length;

  return (
    <ProfilePageClient
      profile={profile}
      email={user.email ?? profile.email ?? ""}
      canList={canList}
      verified={verified}
      activeCount={activeCount}
      pending={pending}
      limit={limit}
      savedCount={savedCount ?? 0}
      expiringSoon={expiringSoon}
      expiredCount={expiredCount}
      leadsCount={leadsCount ?? 0}
      verificationRequestsCount={verificationCount ?? 0}
      memberSince={formatMemberSince(profile.created_at)}
    />
  );
}
