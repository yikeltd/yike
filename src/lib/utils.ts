import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getPropertyCategoryLabel } from "@/constants/propertyCategories";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(
  price: number,
  period: string = "yearly",
  listingType: string = "rent"
): string {
  const formatted = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(price);

  if (listingType === "sale" || period === "total") return formatted;
  const suffix: Record<string, string> = {
    yearly: "/yr",
    monthly: "/mo",
    weekly: "/wk",
    daily: "/day",
  };
  return `${formatted}${suffix[period] ?? ""}`;
}

export function formatPhoneForTel(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234")) return `+${digits}`;
  if (digits.startsWith("0")) return `+234${digits.slice(1)}`;
  return `+234${digits}`;
}

export function normalizeWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return `234${digits}`;
}

export function propertyTypeLabel(value: string | null): string {
  return getPropertyCategoryLabel(value);
}

export function listingTypeLabel(value: string): string {
  const labels: Record<string, string> = {
    rent: "For Rent",
    lease: "For Lease",
    sale: "For Sale",
    shortlet: "Shortlet",
  };
  return labels[value] ?? value;
}

import {
  canListProperties as canListFromProfile,
  isVerifiedAgentProfile,
  type AgentProfileSlice,
} from "@/lib/agent-tiers";

export function isVerifiedAgent(
  profileOrStatus:
    | AgentProfileSlice
    | string
    | null
    | undefined
): boolean {
  if (!profileOrStatus) return false;
  if (typeof profileOrStatus === "string") {
    return (
      profileOrStatus === "approved" || profileOrStatus === "verified"
    );
  }
  return isVerifiedAgentProfile(profileOrStatus);
}

export function canListProperties(
  profile: AgentProfileSlice | null | undefined
): boolean {
  return canListFromProfile(profile);
}

export function canShowPublicly(property: {
  status: string;
  expires_at: string;
}): boolean {
  return property.status === "approved" && new Date(property.expires_at) > new Date();
}
