import type { UserRole } from "@/types/database";
import { loadStaffPermissionContext } from "@/lib/admin/staff-permissions.server";
import { resolveStaffPermissions } from "@/lib/admin/staff-permissions";
import {
  getStaffLandingRoom,
  type StaffLandingRoom,
} from "@/lib/admin/staff-landing-sync";
import type { StaffWorkArea } from "@/lib/admin/staff-work-areas";

export type { StaffLandingRoom } from "@/lib/admin/staff-landing-sync";
export {
  getStaffLandingPathForRole,
  getStaffLandingRoom,
} from "@/lib/admin/staff-landing-sync";

/** Server helper — resolves permissions then landing room. */
export async function resolveStaffLandingRoom(
  userId: string,
  role: UserRole,
  urgentCounts?: Partial<Record<StaffWorkArea, number>>
): Promise<StaffLandingRoom> {
  const ctx = await loadStaffPermissionContext(userId, role);
  const permissions = resolveStaffPermissions(ctx);
  return getStaffLandingRoom({ role, permissions, urgentCounts });
}
