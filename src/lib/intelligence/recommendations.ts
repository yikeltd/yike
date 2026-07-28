/**
 * Intelligence Platform — Recommendation Engine (Phase 1.9)
 *
 * Generates rule-driven recommendations for Buyer, Seller, Trust, and Operations.
 */

import type { BuyerRecommendation, PlatformInsight, TrustGrowthPlan } from "./types";

/** Generate Buyer Recommendations */
export function generateBuyerRecommendations(userContext?: {
  savedCities?: string[];
  preferredCategory?: string;
}): BuyerRecommendation[] {
  return [
    {
      listingId: "prop_lekki_01",
      title: "Luxury 3-Bedroom Apartment — Lekki Phase 1",
      matchScore: 94,
      priceDropDetected: true,
      isVerifiedSeller: true,
      matchReason: "Matches saved search preference in Lekki Phase 1 · Price reduced ₦5M",
    },
    {
      listingId: "car_g_wagon_02",
      title: "2023 Mercedes-AMG G63 — Victoria Island",
      matchScore: 88,
      priceDropDetected: false,
      isVerifiedSeller: true,
      matchReason: "Verified Seller · Physical Inspection Report Available",
    },
    {
      listingId: "prop_ikeja_03",
      title: "Modern 4-Bedroom Semi-Detached Duplex — GRA Ikeja",
      matchScore: 82,
      priceDropDetected: true,
      isVerifiedSeller: true,
      matchReason: "New listing in GRA Ikeja with verified land title search",
    },
  ];
}

/** Generate Trust Growth Plan for User */
export function generateTrustGrowthPlan(user: {
  id: string;
  trustScore: number;
  phoneVerified: boolean;
  ninVerified?: boolean;
  cacVerified?: boolean;
}): TrustGrowthPlan {
  const items = [
    {
      signalKey: "phone",
      title: "Complete Phone SMS OTP Verification",
      potentialPoints: 5,
      completed: user.phoneVerified,
      actionHref: "/agent/verify",
    },
    {
      signalKey: "identity_nin",
      title: "Verify National Identity Number (NIN)",
      potentialPoints: 30,
      completed: Boolean(user.ninVerified),
      actionHref: "/trust/" + user.id,
    },
    {
      signalKey: "business_cac",
      title: "Verify CAC Business Registration",
      potentialPoints: 20,
      completed: Boolean(user.cacVerified),
      actionHref: "/trust/" + user.id,
    },
  ];

  const potentialPointsToAdd = items
    .filter((i) => !i.completed)
    .reduce((sum, i) => sum + i.potentialPoints, 0);

  const insights: PlatformInsight[] = items
    .filter((i) => !i.completed)
    .map((item) => ({
      id: `trust_rec_${item.signalKey}`,
      category: "trust",
      title: item.title,
      priority: item.signalKey === "phone" ? "high" : "medium",
      reason: "Higher trust scores rank listings higher in search results and build buyer confidence.",
      recommendation: `Complete ${item.title} to gain up to +${item.potentialPoints} Trust Score points.`,
      confidenceScore: 95,
      sourcePlatform: "Identity Platform (Yike Passport)",
      action: {
        label: "Complete Verification",
        href: item.actionHref,
      },
      createdAt: new Date().toISOString(),
    }));

  return {
    userId: user.id,
    currentScore: user.trustScore,
    potentialScore: Math.min(100, user.trustScore + potentialPointsToAdd),
    items,
    insights,
  };
}
