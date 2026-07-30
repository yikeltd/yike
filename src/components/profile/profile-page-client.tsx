"use client";

import type { Profile } from "@/types/database";
import type { ProfileSocialStats } from "@/lib/social/types";
import { SellerCommandCenter } from "@/components/profile/seller-command-center";
import type { SellerAnalyticsSummary } from "@/lib/subscriptions/analytics";

export function ProfilePageClient({
  profile,
  email,
  verified,
  activeCount,
  pending,
  totalListings = 0,
  limit,
  savedCount,
  expiringSoon = 0,
  expiredCount = 0,
  draftCount = 0,
  rentedCount = 0,
  soldCount = 0,
  leadsCount = 0,
  missingPhotosCount = 0,
  incompleteListingsCount = 0,
  lowQualityListingsCount = 0,
  listingHealthScore = null,
  memberSince,
  socialStats = { followersCount: 0, listingLikesCount: 0 },
  subscriptionPlanLabel = null,
  subscriptionExpiresInDays = null,
  profileSaved = false,
  analyticsPreviewData,
}: {
  profile: Profile;
  email: string;
  canList: boolean;
  verified: boolean;
  activeCount: number;
  pending: number;
  totalListings?: number;
  limit: number | null;
  savedCount: number;
  expiringSoon?: number;
  expiredCount?: number;
  draftCount?: number;
  rentedCount?: number;
  soldCount?: number;
  leadsCount?: number;
  missingPhotosCount?: number;
  incompleteListingsCount?: number;
  lowQualityListingsCount?: number;
  listingHealthScore?: number | null;
  verificationRequestsCount?: number;
  memberSince: string;
  socialStats?: ProfileSocialStats;
  subscriptionPlanLabel?: string | null;
  subscriptionExpiresInDays?: number | null;
  foundingMember?: boolean;
  profileSaved?: boolean;
  analyticsPreviewData?: SellerAnalyticsSummary | null;
}) {
  // UNIFIED SINGLE SOURCE OF TRUTH — ALWAYS RENDER THE APPROVED PROFILE HEADER & COMMAND CENTER
  return (
    <SellerCommandCenter
      profile={profile}
      email={email}
      verified={verified}
      activeCount={activeCount}
      pending={pending}
      totalListings={totalListings}
      limit={limit}
      savedCount={savedCount}
      expiringSoon={expiringSoon}
      expiredCount={expiredCount}
      draftCount={draftCount}
      rentedCount={rentedCount}
      soldCount={soldCount}
      leadsCount={leadsCount}
      missingPhotosCount={missingPhotosCount}
      incompleteListingsCount={incompleteListingsCount}
      lowQualityListingsCount={lowQualityListingsCount}
      listingHealthScore={listingHealthScore}
      memberSince={memberSince}
      socialStats={socialStats}
      subscriptionPlanLabel={subscriptionPlanLabel}
      subscriptionExpiresInDays={subscriptionExpiresInDays}
      profileSaved={profileSaved}
      analyticsPreviewData={analyticsPreviewData}
    />
  );
}
