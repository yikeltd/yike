/**
 * Enterprise dealer onboarding — business type catalog.
 * Maps wizard choices onto existing Profile.account_type values.
 */

import type { AccountType } from "@/types/database";

export type DealerBusinessTypeId =
  | "car_dealership"
  | "property_agency"
  | "property_developer"
  | "individual_agent"
  | "fleet_company"
  | "equipment_dealer"
  | "other";

export type DealerBusinessType = {
  id: DealerBusinessTypeId;
  label: string;
  description: string;
  accountType: AccountType;
};

export const DEALER_BUSINESS_TYPES: readonly DealerBusinessType[] = [
  {
    id: "car_dealership",
    label: "Car Dealership",
    description: "Sell cars, SUVs, and light vehicles",
    accountType: "dealer",
  },
  {
    id: "property_agency",
    label: "Property Agency",
    description: "Broker homes, land, and commercial space",
    accountType: "agency",
  },
  {
    id: "property_developer",
    label: "Property Developer",
    description: "Build and sell estates or projects",
    accountType: "developer",
  },
  {
    id: "individual_agent",
    label: "Individual Agent",
    description: "Independent agent listing on Yike",
    accountType: "agent",
  },
  {
    id: "fleet_company",
    label: "Fleet Company",
    description: "Manage and sell fleet vehicles",
    accountType: "dealer",
  },
  {
    id: "equipment_dealer",
    label: "Equipment Dealer",
    description: "Heavy equipment and commercial machines",
    accountType: "dealer",
  },
  {
    id: "other",
    label: "Other Professional Seller",
    description: "Professional merchant listing goods or services",
    accountType: "agency",
  },
] as const;

export function resolveDealerBusinessType(
  id: string | null | undefined,
): DealerBusinessType | undefined {
  return DEALER_BUSINESS_TYPES.find((t) => t.id === id);
}

export const DEALER_ONBOARD_PATH = "/agent/onboard";
export const DEALER_ONBOARD_STEPS = [
  "business_type",
  "business_details",
  "address",
  "identity",
  "branding",
  "plan",
] as const;

export type DealerOnboardStep = (typeof DEALER_ONBOARD_STEPS)[number];
