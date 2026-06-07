import type { UserRole } from "@/types/database";

export type StaffRole =
  | "super_admin"
  | "admin"
  | "support"
  | "tech"
  | "content"
  | "careers"
  | "moderator";

export const STAFF_ROLES: StaffRole[] = [
  "super_admin",
  "admin",
  "support",
  "tech",
  "content",
  "careers",
  "moderator",
];

export type AdminConsole = "auth" | "support" | "tech";

export function isStaffRole(role: UserRole): role is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(role);
}

export function isSuperAdmin(role: UserRole) {
  return role === "super_admin" || role === "admin";
}

export function canAccessAuthConsole(role: UserRole) {
  return (
    role === "super_admin" ||
    role === "admin" ||
    role === "content" ||
    role === "careers" ||
    role === "moderator"
  );
}

export function canAccessSupportConsole(role: UserRole) {
  return role === "super_admin" || role === "admin" || role === "support";
}

export function canAccessTechConsole(role: UserRole) {
  return role === "super_admin" || role === "admin" || role === "tech";
}

export function canSwitchConsoles(role: UserRole) {
  return role === "super_admin" || role === "admin";
}

export function getDefaultConsolePath(role: UserRole): string {
  switch (role) {
    case "super_admin":
    case "admin":
      return "/lex/auth/overview";
    case "support":
      return "/lex/support";
    case "tech":
      return "/lex/tech";
    case "careers":
      return "/lex/auth/careers";
    case "moderator":
      return "/lex/auth/reports";
    case "content":
      return "/lex/auth/listings";
    default:
      return "/lex";
  }
}

export function staffRoleLabel(role: UserRole): string {
  const labels: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    support: "Support",
    tech: "Tech",
    content: "Content",
    careers: "Careers",
    moderator: "Moderator",
  };
  return labels[role] ?? role;
}

/** Auth console nav segments a role may access (empty = full access). */
export function authNavAllowlist(role: UserRole): string[] | null {
  if (role === "super_admin" || role === "admin") return null;
  if (role === "careers") return ["overview", "careers"];
  if (role === "moderator")
    return ["overview", "listings", "agents", "reports", "reviews"];
  if (role === "content")
    return ["overview", "listings", "featured", "premium-deals", "hot-picks", "ads", "banners"];
  return [];
}

export function canManageStaff(role: UserRole) {
  return role === "super_admin" || role === "admin";
}

export function requiresAdminPin(role: UserRole) {
  return role === "super_admin" || role === "admin";
}
