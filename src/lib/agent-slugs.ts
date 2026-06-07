import type { Profile } from "@/types/database";

export function slugifyPublicName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function isUuidParam(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export function agentPublicPath(profile: Pick<Profile, "public_slug" | "id">): string {
  return `/agents/${profile.public_slug ?? profile.id}`;
}

export function companyPublicPath(profile: Pick<Profile, "public_slug" | "id" | "account_type" | "company_name">): string {
  if (profile.account_type === "agency" || profile.account_type === "developer") {
    const slug =
      profile.public_slug ??
      slugifyPublicName(profile.company_name ?? profile.id);
    return `/agents/${slug}`;
  }
  return agentPublicPath(profile);
}
