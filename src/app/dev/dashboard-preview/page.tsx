import { notFound } from "next/navigation";
import { ProfilePageClient } from "@/components/profile/profile-page-client";
import type { Profile } from "@/types/database";

/** Dev-only visual preview of the premium dashboard (no auth). */
export default function DashboardPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const profile = {
    id: "preview-user",
    full_name: "Patience Rejoice",
    username: "patience_rejoice",
    email: "patience@example.com",
    phone: "08126775227",
    phone_verified: true,
    email_verified: true,
    whatsapp: "08126775227",
    avatar_url: null,
    cover_url: null,
    role: "user",
    verification_status: "not_started",
    agent_type: null,
    trust_score: 40,
    listing_limit: null,
    ranking_score: 0,
    verified_badge: false,
    is_banned: false,
    plan: "free",
    plan_expires_at: null,
    company_name: null,
    company_bio: null,
    account_type: undefined,
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
  } as unknown as Profile;

  return (
    <ProfilePageClient
      profile={profile}
      email="patience@example.com"
      canList={false}
      verified={false}
      activeCount={0}
      pending={0}
      totalListings={0}
      limit={null}
      savedCount={2}
      verificationRequestsCount={0}
      memberSince="July 2026"
      socialStats={{ followersCount: 0, listingLikesCount: 0 }}
    />
  );
}
