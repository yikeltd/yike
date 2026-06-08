import type { UserRole } from "@/types/database";
import {
  buildDefaultPermissionContext,
  resolveStaffPermissions,
  type StaffPermissions,
} from "@/lib/admin/staff-permissions";
import {
  STAFF_ROOM_PATHS,
  STAFF_WORK_AREA_LABELS,
  workAreaConsole,
  type StaffWorkArea,
} from "@/lib/admin/staff-work-areas";

function isChiefAdmin(role: UserRole): boolean {
  return role === "super_admin" || role === "admin";
}

export type StaffLandingRoom = {
  path: string;
  room: StaffWorkArea;
  label: string;
  console: "auth" | "support" | "tech";
};

const ROLE_LANDING_PRIORITY: Partial<Record<UserRole, StaffWorkArea[]>> = {
  super_admin: ["command_center"],
  admin: ["command_center"],
  support: ["support", "deal_matching"],
  tech: ["tech"],
  moderator: ["trust_review", "listing_review"],
  content: ["listing_review", "command_center"],
  careers: ["command_center"],
};

const AREA_URGENCY_ORDER: StaffWorkArea[] = [
  "trust_review",
  "listing_review",
  "verification",
  "support",
  "deal_matching",
  "ambassadors",
  "legal_partners",
  "command_center",
  "tech",
];

function pickLandingArea(
  role: UserRole,
  permissions: StaffPermissions,
  urgentCounts?: Partial<Record<StaffWorkArea, number>>
): StaffWorkArea {
  const rolePriority = ROLE_LANDING_PRIORITY[role] ?? [];
  const assigned = permissions.work_areas;

  if (urgentCounts) {
    let best: StaffWorkArea | null = null;
    let bestScore = -1;
    for (const area of assigned) {
      const count = urgentCounts[area] ?? 0;
      if (count > bestScore) {
        bestScore = count;
        best = area;
      }
    }
    if (best && bestScore > 0) return best;
  }

  for (const area of rolePriority) {
    if (assigned.includes(area)) return area;
  }

  for (const area of AREA_URGENCY_ORDER) {
    if (assigned.includes(area)) return area;
  }

  if (role === "support") return "support";
  if (role === "tech") return "tech";
  if (isChiefAdmin(role)) return "command_center";
  return assigned[0] ?? "command_center";
}

export function getStaffLandingRoom(params: {
  role: UserRole;
  permissions: StaffPermissions;
  urgentCounts?: Partial<Record<StaffWorkArea, number>>;
}): StaffLandingRoom {
  const area = pickLandingArea(params.role, params.permissions, params.urgentCounts);
  return {
    path: STAFF_ROOM_PATHS[area],
    room: area,
    label: STAFF_WORK_AREA_LABELS[area],
    console: workAreaConsole(area),
  };
}

/** Sync fallback for client redirects and middleware-safe role routing. */
export function getStaffLandingPathForRole(role: UserRole): string {
  const permissions = resolveStaffPermissions(buildDefaultPermissionContext(role));
  return getStaffLandingRoom({ role, permissions }).path;
}
