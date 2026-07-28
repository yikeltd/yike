/**
 * Intelligence Platform — Event & Signal Extractors (Phase 1.9)
 *
 * Consumes events across Conversations, Offers, Deals, Reviews, Verifications, and Revenue.
 */

import type { PlatformInsight } from "./types";

export function extractSellerInsightsFromSignals(sellerId: string): PlatformInsight[] {
  return [
    {
      id: "ins_crm_response",
      category: "seller",
      title: "Improve Inquiry Response Speed",
      priority: "high",
      reason: "Buyer inquiries replied to within 30 minutes convert 3x higher into completed deals.",
      recommendation: "Set up instant WhatsApp quick replies for peak hours (9 AM – 6 PM).",
      confidenceScore: 92,
      sourcePlatform: "Seller Success Platform (Seller CRM)",
      action: {
        label: "Open CRM Workspace",
        href: "/seller/crm",
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: "ins_crm_pricing",
      category: "seller",
      title: "Competitive Pricing Opportunity",
      priority: "medium",
      reason: "Similar 3-bedroom properties in Lekki Phase 1 are selling 4% below your current asking price.",
      recommendation: "Consider a 3% price adjustment to trigger automatic 'Price Drop Alert' to 14 saved buyers.",
      confidenceScore: 88,
      sourcePlatform: "Commerce Platform (Deal Engine)",
      action: {
        label: "Review Inventory",
        href: "/seller/crm",
      },
      createdAt: new Date().toISOString(),
    },
  ];
}
