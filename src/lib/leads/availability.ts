import type { Profile, Property } from "@/types/database";

export type AgentAvailabilityStatus = "active" | "offline" | "unavailable" | "suspended";

export type ListingAvailabilityStatus =
  | "available"
  | "reserved"
  | "rented"
  | "sold"
  | "unavailable"
  | "hidden"
  | "under_review";

const UNAVAILABLE_AGENT: AgentAvailabilityStatus[] = [
  "offline",
  "unavailable",
  "suspended",
];

const REDUCED_VISIBILITY: ListingAvailabilityStatus[] = [
  "reserved",
  "rented",
  "sold",
  "unavailable",
  "under_review",
];

export function isAgentReachable(
  profile: Pick<Profile, "is_banned" | "profile_status" | "availability_status"> | null | undefined
): boolean {
  if (!profile) return false;
  if (profile.is_banned) return false;
  if (profile.profile_status === "suspended" || profile.profile_status === "deleted") {
    return false;
  }
  const status = (profile as Profile & { availability_status?: string })
    .availability_status as AgentAvailabilityStatus | undefined;
  if (status && UNAVAILABLE_AGENT.includes(status)) return false;
  return true;
}

export function shouldRouteToSupportFallback(
  profile: Pick<Profile, "is_banned" | "profile_status" | "availability_status"> | null | undefined
): boolean {
  return !isAgentReachable(profile);
}

export function listingAvailability(
  property: Pick<Property, "availability_status">
): ListingAvailabilityStatus {
  return (
    (property as Property & { availability_status?: ListingAvailabilityStatus })
      .availability_status ?? "available"
  );
}

export function isListingDiscoverable(
  property: Pick<Property, "availability_status" | "status">
): boolean {
  const avail = listingAvailability(property);
  if (avail === "hidden") return false;
  if (property.status !== "approved") return false;
  return !REDUCED_VISIBILITY.includes(avail);
}

export function listingAvailabilityRankPenalty(
  property: Pick<Property, "availability_status">
): number {
  const avail = listingAvailability(property);
  switch (avail) {
    case "available":
      return 0;
    case "reserved":
    case "under_review":
      return 800;
    case "rented":
    case "sold":
    case "unavailable":
      return 4_000;
    case "hidden":
      return 10_000;
    default:
      return 0;
  }
}

export function listingAvailabilityNotice(
  property: Pick<Property, "availability_status">
): string | null {
  const avail = listingAvailability(property);
  if (avail === "rented" || avail === "sold" || avail === "unavailable") {
    return "Property may no longer be available";
  }
  if (avail === "reserved") return "This property may be reserved";
  if (avail === "under_review") return "Listing is under review";
  return null;
}
