import { notFound } from "next/navigation";
import { ProfilePageClient } from "@/components/profile/profile-page-client";
import type { Profile } from "@/types/database";

/** Dev-only visual preview of the premium seller command center (no auth). */
export default function DashboardPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const profile = {
    id: "63307-preview-user",
    full_name: "Patience",
    username: "patience_store",
    email: "patience@example.com",
    phone: "08126775227",
    phone_verified: true,
    email_verified: true,
    whatsapp: "08126775227",
    whatsapp_verified_at: "2026-07-15T10:00:00.000Z",
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80&fit=crop",
    cover_url: null,
    role: "agent_verified",
    verification_status: "approved",
    agent_type: "agency",
    trust_score: 100,
    listing_limit: 40,
    ranking_score: 0,
    verified_badge: true,
    is_banned: false,
    plan: "pro",
    plan_expires_at: null,
    company_name: "Patience Properties",
    company_bio: "Verified merchant on Yike.",
    account_type: "dealer",
    company_verified: true,
    bank_verified: false,
    bank_account_number: "0123456789",
    office_address: "Victoria Island, Lagos",
    residential_city: "Lagos",
    residential_state: "Lagos",
    response_rate: 0.82,
    avg_response_time_minutes: 46,
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
  } as unknown as Profile;

  return (
    <ProfilePageClient
      profile={profile}
      email="patience@example.com"
      canList
      verified
      activeCount={1}
      pending={0}
      totalListings={1}
      limit={40}
      savedCount={0}
      expiringSoon={0}
      expiredCount={0}
      draftCount={0}
      rentedCount={0}
      soldCount={0}
      leadsCount={0}
      missingPhotosCount={0}
      incompleteListingsCount={0}
      lowQualityListingsCount={0}
      listingHealthScore={92}
      verificationRequestsCount={0}
      memberSince="Jul 2026"
      socialStats={{ followersCount: 0, listingLikesCount: 0 }}
      subscriptionPlanLabel="Starter"
      subscriptionExpiresInDays={28}
    />
  );
}
