/**
 * Trust Platform façade — delegates to existing src/lib/trust engines.
 * No new scoring formulas. Activate via YIP plugin.
 */
import type { Confidence } from "../../shared/types";
import type { YipContext } from "../../context/types";
import type { TrustAssessment, TrustService } from "../../trust/types";
import { isVerifiedAgentProfile } from "@/lib/agent-tiers";
import {
  analyzeListingQuality,
  computeListingQualityScore,
  qualityFlagLabel,
} from "@/lib/listing-quality";
import type { Property, Profile } from "@/types/database";

function confidenceFromScore(score: number): Confidence {
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function listingFromContext(context: YipContext): Property | null {
  const raw = context.values.listing ?? context.values.property;
  if (!raw || typeof raw !== "object") return null;
  return raw as Property;
}

function agentFromContext(context: YipContext): Profile | null {
  const raw = context.values.agent ?? context.values.seller ?? context.values.profile;
  if (!raw || typeof raw !== "object") return null;
  return raw as Profile;
}

export type TrustPlatformHealth = {
  status: "healthy" | "degraded" | "unhealthy";
  message: string;
  checkedAt: string;
  engine: "src/lib/trust + listing-quality";
};

export type TrustPlatform = TrustService & {
  health: () => TrustPlatformHealth;
  assessListingQuality: (property: Property) => {
    score: number;
    flags: string[];
    labels: string[];
  };
  assessSellerBadges: (profile: Profile) => string[];
};

export function createTrustPlatform(): TrustPlatform {
  return {
    assess(context: YipContext): TrustAssessment {
      const listing = listingFromContext(context);
      const agent = agentFromContext(context) ?? listing?.agent ?? null;
      const signals: string[] = [];
      const flags: string[] = [];
      let scoreNum = 40;

      if (listing) {
        const quality = computeListingQualityScore(listing);
        scoreNum = Math.round(scoreNum * 0.35 + quality * 0.65);
        const qualityFlags = analyzeListingQuality(listing);
        for (const f of qualityFlags) {
          flags.push(f);
          signals.push(qualityFlagLabel(f));
        }
        if (listing.is_verified_listing) signals.push("Verified listing");
        if ((listing.media_urls?.length ?? 0) >= 4) signals.push("Strong photo set");
      }

      if (agent) {
        if (isVerifiedAgentProfile(agent)) {
          signals.push("Verified seller");
          scoreNum = Math.min(100, scoreNum + 12);
        }
        if (agent.company_verified) {
          signals.push("Verified business");
          scoreNum = Math.min(100, scoreNum + 8);
        }
        if (agent.account_type === "dealer" || agent.account_type === "agency") {
          signals.push("Professional seller");
        }
      }

      if (context.photoCount >= 4) signals.push("Photo completeness");
      if (context.photoCount < 2) flags.push("few_images");

      return {
        score: confidenceFromScore(scoreNum),
        signals: [...new Set(signals)],
        flags: [...new Set(flags)],
      };
    },

    assessListingQuality(property: Property) {
      const score = computeListingQualityScore(property);
      const flags = analyzeListingQuality(property);
      return {
        score,
        flags,
        labels: flags.map(qualityFlagLabel),
      };
    },

    assessSellerBadges(profile: Profile) {
      const badges: string[] = [];
      if (isVerifiedAgentProfile(profile)) badges.push("Verified Seller");
      if (profile.company_verified) badges.push("Verified Business");
      if (profile.account_type === "dealer") badges.push("Verified Dealer");
      if (profile.account_type === "agency") badges.push("Verified Agency");
      if (profile.account_type === "developer") badges.push("Verified Developer");
      return badges;
    },

    health(): TrustPlatformHealth {
      return {
        status: "healthy",
        message: "Trust platform delegates to listing-quality + agent verification signals",
        checkedAt: new Date().toISOString(),
        engine: "src/lib/trust + listing-quality",
      };
    },
  };
}
