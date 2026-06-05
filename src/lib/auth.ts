import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Profile, UserRole } from "@/types/database";
import { canListProperties } from "@/lib/utils";
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
  return requireRole(["agent", "admin", "super_admin"], "/agent");
}

export function isEmailVerified(user: User, profile?: Profile | null): boolean {
  if (user.email_confirmed_at) return true;
  return profile?.email_verified === true;
}

export async function requireVerifiedLister(redirectTo = "/agent/verification") {
  const user = await requireAuth();
  const profile = await getProfile(user.id);
  if (!profile || profile.is_banned) redirect("/");
  if (
    isAdmin(profile.role) ||
    canListProperties(profile.verification_status)
  ) {
    return { user, profile };
  }
  redirect(redirectTo);
}

export async function requireFullSession(redirectTo = "/auth/verify-email") {
  const user = await requireAuth();
  const profile = await getProfile(user.id);
  if (!isEmailVerified(user, profile)) {
    redirect(redirectTo);
  }
  return { user, profile };
}

export async function requireAdmin() {
  return requireRole(["admin", "super_admin"], "/");
}

export function isAdmin(role: UserRole) {
  return role === "admin" || role === "super_admin";
}
