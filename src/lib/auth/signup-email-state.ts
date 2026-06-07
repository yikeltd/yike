import type { SupabaseClient } from "@supabase/supabase-js";
import { findAuthUserByEmail } from "@/lib/auth/find-auth-user";
import { signupPendingGet } from "@/lib/auth-email-otp/rpc";

export type SignupEmailState =
  | { status: "available" }
  | { status: "complete"; userId: string }
  | { status: "incomplete"; userId: string; hasProfile: boolean }
  | { status: "deleted"; userId: string }
  | { status: "pending_signup" };

export async function resolveSignupEmailState(
  admin: SupabaseClient,
  db: SupabaseClient,
  email: string
): Promise<SignupEmailState> {
  const normalized = email.trim().toLowerCase();
  const authUser = await findAuthUserByEmail(admin, normalized);

  if (!authUser) {
    const pending = await signupPendingGet(db, normalized);
    if (pending) return { status: "pending_signup" };
    return { status: "available" };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id, pin_hash, email_verified, profile_status, deleted_at, account_status")
    .eq("id", authUser.id)
    .maybeSingle();

  if (
    profile?.profile_status === "deleted" ||
    profile?.deleted_at ||
    profile?.account_status === "deleted"
  ) {
    return { status: "deleted", userId: authUser.id };
  }

  const needsResume =
    !profile || !profile.pin_hash || profile.email_verified === false;

  if (needsResume) {
    return {
      status: "incomplete",
      userId: authUser.id,
      hasProfile: Boolean(profile),
    };
  }

  return { status: "complete", userId: authUser.id };
}
