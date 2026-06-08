import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSuperAdmin } from "@/lib/admin/roles";
import type { UserRole } from "@/types/database";

const COOKIE_NAME = "yike_support_view";
const SESSION_HOURS = 2;

export type SupportViewSession = {
  sessionId: string;
  adminId: string;
  targetUserId: string;
  targetUserName: string | null;
  readOnly: boolean;
  startedAt: string;
};

export async function canViewAccounts(
  adminId: string,
  role: UserRole
): Promise<boolean> {
  if (isSuperAdmin(role)) return true;

  const admin = createAdminClient();
  if (!admin) return false;

  const { data } = await admin
    .from("account_view_permissions")
    .select("can_view_accounts")
    .eq("profile_id", adminId)
    .maybeSingle();

  return data?.can_view_accounts === true;
}

export async function getActiveSupportView(
  adminId: string
): Promise<SupportViewSession | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as SupportViewSession;
    if (parsed.adminId !== adminId) return null;
    const started = new Date(parsed.startedAt).getTime();
    if (Date.now() - started > SESSION_HOURS * 60 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setSupportViewCookie(session: SupportViewSession): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_HOURS * 60 * 60,
    path: "/",
  });
}

export async function clearSupportViewCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Fields that must never appear in support view API responses. */
export const SENSITIVE_PROFILE_FIELDS = [
  "pin_hash",
  "admin_pin_hash",
  "password_hash",
] as const;

export function maskProfileForSupportView<T extends Record<string, unknown>>(
  profile: T
): Omit<T, (typeof SENSITIVE_PROFILE_FIELDS)[number]> {
  const masked = { ...profile };
  for (const key of SENSITIVE_PROFILE_FIELDS) {
    if (key in masked) delete masked[key];
  }
  return masked as Omit<T, (typeof SENSITIVE_PROFILE_FIELDS)[number]>;
}
