import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  STAFF_LOGIN_PATH,
  ADMIN_BASE_PATH,
  SUPPORT_BASE_PATH,
  TECH_BASE_PATH,
} from "@/lib/admin-paths";
import {
  canAccessAuthConsole,
  canAccessSupportConsole,
  canAccessTechConsole,
  isStaffRole,
  isSuperAdmin,
} from "@/lib/admin/roles";
import type { Profile, UserRole } from "@/types/database";
import { canListProperties } from "@/lib/agent-tiers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export async function getSession() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data as Profile | null;
}

export async function requireAuth(redirectTo = "/auth/login") {
  const user = await getSession();
  if (!user) redirect(redirectTo);
  return user;
}

export async function requireRole(roles: UserRole[], redirectTo = "/") {
  const user = await requireAuth();
  const profile = await getProfile(user.id);
  if (!profile || profile.is_banned || !roles.includes(profile.role)) {
    redirect(redirectTo);
  }
  return { user, profile };
}

export async function requireAgent() {
  return requireRole(
    ["agent_unverified", "agent_verified", "admin", "super_admin"],
    "/agent"
  );
}

export function isEmailVerified(
  user: User,
  profile?: Pick<Profile, "email_verified"> | null
): boolean {
  if (user.email_confirmed_at) return true;
  return profile?.email_verified === true;
}

export async function requireAgentLister(redirectTo = "/agent/become") {
  const user = await requireAuth();
  const profile = await getProfile(user.id);
  if (!profile || profile.is_banned) redirect("/");

  if (!profile.phone_verified) {
    redirect("/auth/verify-phone?next=/agent/become");
  }
  if (!isEmailVerified(user, profile)) {
    redirect("/auth/verify-email?next=/agent/become");
  }

  if (isAdmin(profile.role) || canListProperties(profile)) {
    return { user, profile };
  }
  redirect(redirectTo);
}

/** @deprecated use requireAgentLister */
export const requireVerifiedLister = requireAgentLister;

export async function requireFullSession(redirectTo = "/auth/verify-email") {
  const user = await requireAuth();
  const profile = await getProfile(user.id);
  if (!isEmailVerified(user, profile)) {
    redirect(redirectTo);
  }
  return { user, profile };
}

export function isAdmin(role: UserRole) {
  return role === "admin" || role === "super_admin";
}

export function isStaff(role: UserRole) {
  return isStaffRole(role);
}

export async function requireStaff() {
  const user = await requireAuth(STAFF_LOGIN_PATH);
  const profile = await getProfile(user.id);
  if (!profile || profile.is_banned || !isStaff(profile.role)) {
    redirect(STAFF_LOGIN_PATH);
  }
  return { user, profile };
}

export async function requireAdmin() {
  const user = await requireAuth(STAFF_LOGIN_PATH);
  const profile = await getProfile(user.id);
  if (!profile || profile.is_banned || !canAccessAuthConsole(profile.role)) {
    redirect(STAFF_LOGIN_PATH);
  }
  return { user, profile };
}

export async function requireSuperAdmin() {
  const user = await requireAuth(STAFF_LOGIN_PATH);
  const profile = await getProfile(user.id);
  if (!profile || profile.is_banned || !isSuperAdmin(profile.role)) {
    redirect(STAFF_LOGIN_PATH);
  }
  return { user, profile };
}

export async function requireSupportConsole() {
  const user = await requireAuth(STAFF_LOGIN_PATH);
  const profile = await getProfile(user.id);
  if (!profile || profile.is_banned || !canAccessSupportConsole(profile.role)) {
    redirect(STAFF_LOGIN_PATH);
  }
  return { user, profile };
}

export async function requireTechConsole() {
  const user = await requireAuth(STAFF_LOGIN_PATH);
  const profile = await getProfile(user.id);
  if (!profile || profile.is_banned || !canAccessTechConsole(profile.role)) {
    redirect(STAFF_LOGIN_PATH);
  }
  return { user, profile };
}

export async function requireAuthConsoleSegment(segment: string) {
  const { user, profile } = await requireAdmin();
  if (isSuperAdmin(profile.role)) return { user, profile };

  const { authNavAllowlist } = await import("@/lib/admin/roles");
  const allowed = authNavAllowlist(profile.role);
  if (!allowed) return { user, profile };

  const normalized = segment.replace(/^\//, "").split("/")[0] ?? "overview";
  if (!allowed.includes(normalized)) {
    redirect(`${ADMIN_BASE_PATH}/${allowed[0] ?? "overview"}`);
  }
  return { user, profile };
}
