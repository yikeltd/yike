import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ADMIN_LOGIN_PATH } from "@/lib/admin-paths";
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

export async function requireAdmin() {
  const user = await requireAuth(ADMIN_LOGIN_PATH);
  const profile = await getProfile(user.id);
  if (!profile || profile.is_banned || !isAdmin(profile.role)) {
    redirect(ADMIN_LOGIN_PATH);
  }
  return { user, profile };
}

export function isAdmin(role: UserRole) {
  return role === "admin" || role === "super_admin";
}
