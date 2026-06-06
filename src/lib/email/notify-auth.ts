import { getProfile, getSession, isAdmin } from "@/lib/auth";

export async function requireAdminApi() {
  const user = await getSession();
  if (!user) return { ok: false as const, status: 401, error: "Sign in required" };

  const profile = await getProfile(user.id);
  if (!profile || profile.is_banned || !isAdmin(profile.role)) {
    return { ok: false as const, status: 403, error: "Admin access required" };
  }

  return { ok: true as const, user, profile };
}

export async function requireSessionApi() {
  const user = await getSession();
  if (!user) return { ok: false as const, status: 401, error: "Sign in required" };
  return { ok: true as const, user };
}
