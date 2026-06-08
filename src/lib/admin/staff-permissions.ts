import type { StaffProfile, UserRole } from "@/types/database";
import {
  responsibilitiesToWorkAreas,
  STAFF_WORK_AREAS,
  type StaffWorkArea,
} from "@/lib/admin/staff-work-areas";

function isChiefAdmin(role: UserRole): boolean {
  return role === "super_admin" || role === "admin";
}

export type StaffPermissions = {
  can_manage_deal_matching: boolean;
  can_review_listings: boolean;
  can_manage_verifications: boolean;
  can_manage_support: boolean;
  can_manage_payouts: boolean;
  can_enforce_trust: boolean;
  work_areas: StaffWorkArea[];
};

export type StaffPermissionContext = {
  profileRole: UserRole;
  staffProfile: Pick<
    StaffProfile,
    "id" | "role" | "department" | "responsibilities" | "status"
  > | null;
  assignedAreas: StaffWorkArea[];
  dealMatching: boolean;
  verificationControl: boolean;
  enforceTrust: boolean;
};

function roleDefaultAreas(role: UserRole): StaffWorkArea[] {
  switch (role) {
    case "super_admin":
    case "admin":
      return [...STAFF_WORK_AREAS];
    case "support":
      return ["support"];
    case "tech":
      return ["tech"];
    case "moderator":
      return ["listing_review", "trust_review"];
    case "content":
      return ["listing_review", "command_center"];
    case "careers":
      return ["command_center"];
    default:
      return [];
  }
}

export function resolveStaffPermissions(ctx: StaffPermissionContext): StaffPermissions {
  const role = ctx.profileRole;
  const responsibilityAreas = responsibilitiesToWorkAreas(
    ctx.staffProfile?.responsibilities
  );

  const workAreas = new Set<StaffWorkArea>([
    ...roleDefaultAreas(role),
    ...responsibilityAreas,
    ...ctx.assignedAreas,
  ]);

  if (ctx.dealMatching) workAreas.add("deal_matching");
  if (ctx.verificationControl) workAreas.add("verification");
  if (ctx.enforceTrust) workAreas.add("trust_review");

  if (role === "support" && !ctx.dealMatching) {
    workAreas.delete("deal_matching");
  }

  if (!isChiefAdmin(role)) {
    workAreas.delete("command_center");
    if (role === "content" || role === "careers" || role === "moderator") {
      workAreas.add("command_center");
    }
  }

  const areas = [...workAreas];

  return {
    can_manage_deal_matching: ctx.dealMatching || isChiefAdmin(role),
    can_review_listings:
      areas.includes("listing_review") ||
      role === "moderator" ||
      role === "content" ||
      isChiefAdmin(role),
    can_manage_verifications:
      ctx.verificationControl ||
      areas.includes("verification") ||
      isChiefAdmin(role),
    can_manage_support:
      areas.includes("support") || role === "support" || isChiefAdmin(role),
    can_manage_payouts: isChiefAdmin(role),
    can_enforce_trust:
      ctx.enforceTrust ||
      areas.includes("trust_review") ||
      role === "moderator" ||
      isChiefAdmin(role),
    work_areas: areas,
  };
}

export function buildDefaultPermissionContext(role: UserRole): StaffPermissionContext {
  return {
    profileRole: role,
    staffProfile: null,
    assignedAreas: [],
    dealMatching: isChiefAdmin(role),
    verificationControl: isChiefAdmin(role),
    enforceTrust: role === "moderator" || isChiefAdmin(role),
  };
}
