import { notFound } from "next/navigation";
import { ProfilePageClient } from "@/components/profile/profile-page-client";
import type { Profile } from "@/types/database";

/** Dev-only visual preview of the premium seller command center (no auth). */
export default function DashboardPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const profile = {
    id: "preview-user",
    full_name: "Stanley Okoro",
    username: "stanhan_auto",
    email: "dealer@example.com",
    phone: "08126775227",
    phone_verified: true,
    email_verified: true,
    whatsapp: "08126775227",
    whatsapp_verified_at: "2026-07-15T10:00:00.000Z",
    avatar_url: null,
    cover_url: null,
    role: "agent_verified",
    verification_status: "approved",
    agent_type: "agency",
    trust_score: 96,
    listing_limit: 40,
    ranking_score: 0,
    verified_badge: true,
    is_banned: false,
    plan: "pro",
    plan_expires_at: null,
    company_name: "Stanhan Auto Hub",
    company_bio: "Verified dealer serving Lagos and Abuja buyers.",
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
      email="dealer@example.com"
      canList
      verified
      activeCount={18}
      pending={2}
      totalListings={27}
      limit={40}
      savedCount={14}
      expiringSoon={1}
      expiredCount={3}
      draftCount={0}
      rentedCount={1}
      soldCount={3}
      leadsCount={9}
      missingPhotosCount={2}
      incompleteListingsCount={1}
      lowQualityListingsCount={2}
      listingHealthScore={92}
      verificationRequestsCount={0}
      memberSince="July 2026"
      socialStats={{ followersCount: 218, listingLikesCount: 67 }}
      subscriptionPlanLabel="Starter"
      subscriptionExpiresInDays={28}
      analyticsPreviewData={{
        listingViews: 1284,
        whatsappClicks: 76,
        callClicks: 31,
        saves: 84,
        followers: 218,
        listingLikes: 67,
        leadsGenerated: 9,
        hasAdvanced: false,
        planCode: "starter",
      }}
    />
  );
}
