export type ServiceProviderType =
  | "mover"
  | "painter"
  | "electrician"
  | "plumber"
  | "cleaner"
  | "relocation_support"
  | "carpenter"
  | "ac_technician"
  | "interior_designer"
  | "fumigation"
  | "generator_technician";

export type ServiceProviderVerificationStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "paused"
  | "suspended"
  | "fraud_review";

export type ServiceRequestStatus =
  | "submitted"
  | "reviewing"
  | "assigned"
  | "in_progress"
  | "completed"
  | "disputed"
  | "cancelled";

export const SERVICE_PROVIDER_TYPES: {
  id: ServiceProviderType;
  label: string;
  group: "core" | "relocation" | "future";
  publicReady: boolean;
}[] = [
  { id: "mover", label: "Mover", group: "core", publicReady: true },
  { id: "painter", label: "Painter", group: "core", publicReady: true },
  { id: "electrician", label: "Electrician", group: "core", publicReady: true },
  { id: "plumber", label: "Plumber", group: "core", publicReady: true },
  { id: "cleaner", label: "Cleaner", group: "core", publicReady: true },
  { id: "carpenter", label: "Carpenter", group: "core", publicReady: true },
  { id: "ac_technician", label: "AC Technician", group: "core", publicReady: true },
  {
    id: "relocation_support",
    label: "Relocation Support",
    group: "relocation",
    publicReady: true,
  },
  { id: "interior_designer", label: "Interior Designer", group: "future", publicReady: false },
  { id: "fumigation", label: "Fumigation", group: "future", publicReady: false },
  {
    id: "generator_technician",
    label: "Generator / Solar",
    group: "future",
    publicReady: false,
  },
];

export const RELOCATION_SUPPORT_SERVICES = [
  "Move coordination",
  "Temporary accommodation help",
  "Inspection coordination",
  "Utility setup guidance",
  "Local orientation support",
] as const;

const TYPE_MAP = new Map(SERVICE_PROVIDER_TYPES.map((t) => [t.id, t]));

export function getServiceProviderTypeLabel(type: string): string {
  return TYPE_MAP.get(type as ServiceProviderType)?.label ?? type;
}

export function isValidServiceProviderType(type: string): type is ServiceProviderType {
  return TYPE_MAP.has(type as ServiceProviderType);
}

/** Future SEO slug: movers-in-lekki */
export function buildServiceSeoSlug(
  providerType: ServiceProviderType,
  city: string
): string {
  const typeSlug = providerType.replace(/_/g, "-");
  const citySlug = city
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${typeSlug}s-in-${citySlug}`;
}

export function parseServiceSeoSlug(slug: string): {
  providerType: ServiceProviderType;
  city: string;
} | null {
  const match = slug.match(/^(.+?)s-in-(.+)$/);
  if (!match) return null;
  const typePart = match[1].replace(/-/g, "_");
  if (!isValidServiceProviderType(typePart)) return null;
  const city = match[2]
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return { providerType: typePart, city };
}
