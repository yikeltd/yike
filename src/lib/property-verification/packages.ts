export type PropertyVerificationPackageId = "basic" | "standard" | "premium";

export const PROPERTY_VERIFICATION_PACKAGES: Record<
  PropertyVerificationPackageId,
  {
    id: PropertyVerificationPackageId;
    label: string;
    amount: number;
    sla: string;
    target: string;
    features: string[];
    highlighted?: boolean;
  }
> = {
  basic: {
    id: "basic",
    label: "Basic Verification",
    amount: 4_999,
    sla: "48–72 hours",
    target: "Renters · students · shortlet seekers",
    features: [
      "Property exists",
      "Property available",
      "Pictures match property",
      "Agent reachable",
    ],
  },
  standard: {
    id: "standard",
    label: "Standard Verification",
    amount: 14_999,
    sla: "24–48 hours",
    target: "Most buyers and renters",
    highlighted: true,
    features: [
      "Everything in Basic",
      "Physical inspection",
      "Neighborhood review",
      "Road access",
      "Area observations",
      "Additional photos",
    ],
  },
  premium: {
    id: "premium",
    label: "Premium Verification",
    amount: 29_999,
    sla: "Same day if available",
    target: "Diaspora clients · high-value buyers",
    features: [
      "Everything in Standard",
      "Detailed report",
      "Video walkthrough",
      "Same-day priority if available",
      "Direct consultation call",
    ],
  },
};

export const PROPERTY_VERIFICATION_SAFETY_COPY =
  "Yike provides independent physical inspection assistance only. Yike does not guarantee ownership, title, legal status, or legal rights to any property.";

export const PROPERTY_PHYSICALLY_VERIFIED_LABEL = "Property Physically Verified";

export function packageAmount(id: PropertyVerificationPackageId): number {
  return PROPERTY_VERIFICATION_PACKAGES[id].amount;
}

export function isPackageId(value: string): value is PropertyVerificationPackageId {
  return value === "basic" || value === "standard" || value === "premium";
}
