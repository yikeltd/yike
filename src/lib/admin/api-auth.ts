import { getProfile, getSession } from "@/lib/auth";
import {
  canAccessAuthConsole,
  canAccessSupportConsole,
  canAccessTechConsole,
  isStaffRole,
  isSuperAdmin,
} from "@/lib/admin/roles";
import type { UserRole } from "@/types/database";

export async function requireStaffApi() {
  const user = await getSession();
  if (!user) return { ok: false as const, status: 401, error: "Sign in required" };

  const profile = await getProfile(user.id);
  if (!profile || profile.is_banned || !isStaffRole(profile.role)) {
    return { ok: false as const, status: 403, error: "Staff access required" };
  }

  return { ok: true as const, user, profile };
}

export async function requireAdminApi() {
  const user = await getSession();
  if (!user) return { ok: false as const, status: 401, error: "Sign in required" };

  const profile = await getProfile(user.id);
  if (!profile || profile.is_banned || !canAccessAuthConsole(profile.role)) {
    return { ok: false as const, status: 403, error: "Admin access required" };
  }

  return { ok: true as const, user, profile };
}

export async function requireSuperAdminApi() {
  const user = await getSession();
  if (!user) return { ok: false as const, status: 401, error: "Sign in required" };

  const profile = await getProfile(user.id);
  if (!profile || profile.is_banned || !isSuperAdmin(profile.role)) {
    return { ok: false as const, status: 403, error: "Super admin access required" };
  }

  return { ok: true as const, user, profile };
}

export async function requireSupportApi() {
  const auth = await requireStaffApi();
  if (!auth.ok) return auth;
  if (!canAccessSupportConsole(auth.profile.role)) {
    return { ok: false as const, status: 403, error: "Support access required" };
  }
  return auth;
}

export async function requireTechApi() {
  const auth = await requireStaffApi();
  if (!auth.ok) return auth;
  if (!canAccessTechConsole(auth.profile.role)) {
    return { ok: false as const, status: 403, error: "Tech access required" };
  }
  return auth;
}

export async function requireSessionApi() {
  const user = await getSession();
  if (!user) return { ok: false as const, status: 401, error: "Sign in required" };
  return { ok: true as const, user };
}

export async function requireDealMatchingApi() {
  const user = await getSession();
  if (!user) return { ok: false as const, status: 401, error: "Sign in required" };

  const profile = await getProfile(user.id);
  if (!profile || profile.is_banned) {
    return { ok: false as const, status: 403, error: "Access denied" };
  }

  const { canManageDealMatching } = await import("@/lib/deal-matching/permissions");
  const allowed = await canManageDealMatching(user.id, profile.role);
  if (!allowed) {
    return { ok: false as const, status: 403, error: "Deal matching access required" };
  }

  return { ok: true as const, user, profile };
}

export function roleAllowsAction(role: UserRole, action: string): boolean {
  if (isSuperAdmin(role)) return true;
  const supportActions = ["ticket.update", "report.view", "contact.view"];
  const techActions = ["health.view", "logs.view", "webhook.view"];
  const moderatorActions = ["listing.review", "report.resolve", "agent.review"];
  const contentActions = ["listing.edit", "featured.edit", "banner.edit"];
  const careersActions = ["career.view", "application.update"];

  if (role === "support") return supportActions.some((a) => action.startsWith(a.split(".")[0]));
  if (role === "tech") return techActions.some((a) => action.startsWith(a.split(".")[0]));
  if (role === "moderator") return moderatorActions.some((a) => action.includes(a.split(".")[0] ?? ""));
  if (role === "content") return contentActions.some((a) => action.includes(a.split(".")[0] ?? ""));
  if (role === "careers") return careersActions.some((a) => action.includes(a.split(".")[0] ?? ""));
  return false;
}
