import { SITE_URL } from "@/lib/constants";
import type { StaffRole } from "@/types/database";
import type { StaffWorkArea } from "@/lib/admin/staff-work-areas";

export const DEFAULT_YIKE_STAFF_LOGIN_URL = `${SITE_URL}/lex?app=staff`;
export const DEFAULT_ZOHO_MAIL_LOGIN_URL = "https://mail.zoho.com";
export const STAFF_ONBOARDING_EMAIL_SUBJECT = "Welcome to Yike Crew";

/** Operational role labels mapped to Yike staff role + default work areas. */
export type OnboardingRoleKey =
  | "support"
  | "listings_review"
  | "trust_ops"
  | "legal_ops"
  | "ambassador_ops"
  | "verifier_ops"
  | "content"
  | "admin"
  | "tech";

export type OnboardingRoleOption = {
  key: OnboardingRoleKey;
  label: string;
  staffRole: StaffRole;
  defaultDepartment: string;
  workAreas: StaffWorkArea[];
  description: string;
};

export const ONBOARDING_ROLE_OPTIONS: OnboardingRoleOption[] = [
  {
    key: "support",
    label: "Customer Support",
    staffRole: "support",
    defaultDepartment: "Support",
    workAreas: ["support", "deal_matching"],
    description: "User support, inquiries, and handoffs",
  },
  {
    key: "listings_review",
    label: "Listing Review",
    staffRole: "moderator",
    defaultDepartment: "Listings",
    workAreas: ["listing_review"],
    description: "Listing quality and moderation queue",
  },
  {
    key: "trust_ops",
    label: "Trust Ops",
    staffRole: "moderator",
    defaultDepartment: "Trust",
    workAreas: ["trust_review", "listing_review"],
    description: "Trust signals, fraud review, and risk",
  },
  {
    key: "legal_ops",
    label: "Legal Ops",
    staffRole: "moderator",
    defaultDepartment: "Legal",
    workAreas: ["legal_partners"],
    description: "Legal partner and document workflows",
  },
  {
    key: "ambassador_ops",
    label: "City Ambassador Ops",
    staffRole: "moderator",
    defaultDepartment: "Growth",
    workAreas: ["ambassadors"],
    description: "Ambassador program and city supply",
  },
  {
    key: "verifier_ops",
    label: "Field Verifier Ops",
    staffRole: "moderator",
    defaultDepartment: "Verification",
    workAreas: ["verification"],
    description: "Property verification operations",
  },
  {
    key: "content",
    label: "Content & SEO",
    staffRole: "content",
    defaultDepartment: "Content",
    workAreas: ["listing_review", "command_center"],
    description: "Content, SEO, and brand copy",
  },
  {
    key: "admin",
    label: "Admin / Command",
    staffRole: "admin",
    defaultDepartment: "Operations",
    workAreas: ["command_center"],
    description: "Command center and cross-team ops",
  },
  {
    key: "tech",
    label: "Tech Ops",
    staffRole: "tech",
    defaultDepartment: "Engineering",
    workAreas: ["tech"],
    description: "Platform, integrations, and internal tools",
  },
];

export function getOnboardingRoleOption(key: OnboardingRoleKey): OnboardingRoleOption {
  return ONBOARDING_ROLE_OPTIONS.find((o) => o.key === key) ?? ONBOARDING_ROLE_OPTIONS[0];
}
