import { getDefaultConsolePath, isStaffRole } from "@/lib/admin/roles";
import { canListProperties } from "@/lib/agent-tiers";
import type { Profile, UserRole } from "@/types/database";

function resolveRole(
  profile: Pick<Profile, "role"> | null | undefined,
  roleOverride?: UserRole | null
): UserRole | null {
  return profile?.role ?? roleOverride ?? null;
}

/**
 * Profile / account page from server-trusted role — never from URL params.
 * Canonical signed-in destination: `/agent` (consumer + seller). Staff → console.
 */
export function resolveProfilePath(
  profile: Pick<Profile, "role"> | null | undefined,
  roleOverride?: UserRole | null
): string {
  const role = resolveRole(profile, roleOverride);
  if (role && isStaffRole(role)) {
    return getDefaultConsolePath(role);
  }
  return "/agent";
}

/**
 * Seller dashboard entry (listings hub). Consumers use {@link resolveProfilePath}.
 */
export function resolveAccountHomePath(
  profile: Pick<Profile, "role"> | null | undefined,
  roleOverride?: UserRole | null
): string {
  const role = resolveRole(profile, roleOverride);
  if (role && isStaffRole(role)) {
    return getDefaultConsolePath(role);
  }
  if (role && canListProperties({ role } as Profile)) {
    return "/agent/listings";
  }
  return "/agent";
}
