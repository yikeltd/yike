import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Profile, UserRole } from "@/types/database";
import { redirect } from "next/navigation";

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

export async function requireAdmin() {
  return requireRole(["admin", "super_admin"], "/");
}

export function isAdmin(role: UserRole) {
  return role === "admin" || role === "super_admin";
}
