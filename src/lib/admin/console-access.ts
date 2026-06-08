import type { UserRole } from "@/types/database";
import {
  ADMIN_BASE_PATH,
  STAFF_LOGIN_PATH,
  SUPPORT_BASE_PATH,
  TECH_BASE_PATH,
} from "@/lib/admin-paths";
import {
  authNavAllowlist,
  canAccessAuthConsole,
  getDefaultConsolePath,
  isSuperAdmin,
  type AdminConsole,
} from "@/lib/admin/roles";

const SUPER_ADMIN_ONLY_SEGMENTS = new Set([
  "staff",
  "users",
  "settings",
  "audit-logs",
  "health",
  "deal-matching",
]);

export const DEAL_MATCHING_BASE_PATH = "/lex/auth/deal-matching";

export function isDealMatchingPath(pathname: string): boolean {
  return (
    pathname === DEAL_MATCHING_BASE_PATH ||
    pathname.startsWith(`${DEAL_MATCHING_BASE_PATH}/`)
  );
}

export function consoleFromPath(pathname: string): AdminConsole | null {
  if (pathname === ADMIN_BASE_PATH || pathname.startsWith(`${ADMIN_BASE_PATH}/`)) {
    return "auth";
  }
  if (pathname === SUPPORT_BASE_PATH || pathname.startsWith(`${SUPPORT_BASE_PATH}/`)) {
    return "support";
  }
  if (pathname === TECH_BASE_PATH || pathname.startsWith(`${TECH_BASE_PATH}/`)) {
    return "tech";
  }
  return null;
}

export function roleHomeConsole(role: UserRole): AdminConsole | null {
  if (role === "support") return "support";
  if (role === "tech") return "tech";
  if (canAccessAuthConsole(role)) return "auth";
  return null;
}

export function isRoleAllowedInConsole(
  role: UserRole,
  console: AdminConsole,
  pathname?: string
): boolean {
  if (
    console === "auth" &&
    role === "support" &&
    pathname &&
    isDealMatchingPath(pathname)
  ) {
    return true;
  }
  return roleHomeConsole(role) === console;
}

export function authSegmentFromPath(pathname: string): string {
  const prefix = `${ADMIN_BASE_PATH}/`;
  if (!pathname.startsWith(prefix)) return "overview";
  const rest = pathname.slice(prefix.length);
  return rest.split("/")[0] || "overview";
}

export function isAuthSegmentAllowed(role: UserRole, segment: string): boolean {
  if (isSuperAdmin(role)) return true;
  if (SUPER_ADMIN_ONLY_SEGMENTS.has(segment)) return false;

  const allowed = authNavAllowlist(role);
  if (!allowed) return true;
  return allowed.includes(segment);
}

/** Redirect target when a signed-in staff member hits the wrong console or segment. */
export function staffConsoleRedirect(
  role: UserRole,
  pathname: string
): string | null {
  if (pathname === STAFF_LOGIN_PATH || pathname === `${STAFF_LOGIN_PATH}/`) {
    return getDefaultConsolePath(role);
  }

  const console = consoleFromPath(pathname);
  if (!console) return null;

  if (!isRoleAllowedInConsole(role, console, pathname)) {
    if (console === "auth" && isDealMatchingPath(pathname) && role === "support") {
      return null;
    }
    return getDefaultConsolePath(role);
  }

  if (console === "auth") {
    const segment = authSegmentFromPath(pathname);
    if (segment === "deal-matching") return null;
    if (!isAuthSegmentAllowed(role, segment)) {
      const allowed = authNavAllowlist(role);
      const fallback = allowed?.[0] ?? "overview";
      return `${ADMIN_BASE_PATH}/${fallback}`;
    }
  }

  return null;
}
