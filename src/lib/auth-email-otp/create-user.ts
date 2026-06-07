import type { SupabaseClient } from "@supabase/supabase-js";
import {
  completeSignupProfile,
  confirmReviewerEmail,
} from "@/lib/auth/signup-rpc";
import { isReviewerAccountEmail } from "@/lib/reviewer-accounts";
import type { SignupPendingRow } from "./rpc";
import { emailConfirmUser, signupPendingDelete } from "./rpc";

export async function createConfirmedAuthUser(
  admin: SupabaseClient,
  params: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    username: string;
  }
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const email = params.email.trim().toLowerCase();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: params.password,
    email_confirm: true,
    user_metadata: {
      full_name: params.fullName,
      phone: params.phone,
      username: params.username,
    },
  });

  if (error || !data.user) {
    const lower = (error?.message ?? "").toLowerCase();
    if (lower.includes("already") || lower.includes("registered")) {
      return {
        ok: false,
        error: "An account already exists with this email. Please sign in.",
      };
    }
    console.error("[auth-email-otp] createUser failed:", error?.message);
    return { ok: false, error: "Could not create account. Please try again." };
  }

  return { ok: true, userId: data.user.id };
}

export async function finalizeSignupAfterOtp(
  admin: SupabaseClient,
  db: SupabaseClient,
  pending: SignupPendingRow,
  password: string
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const created = await createConfirmedAuthUser(admin, {
    email: pending.email,
    password,
    fullName: pending.full_name,
    phone: pending.phone ?? "",
    username: pending.username,
  });

  if (!created.ok) return created;

  const profileOk = await completeSignupProfile({
    userId: created.userId,
    username: pending.username,
    pinHash: pending.pin_hash,
    phone: pending.phone ?? "",
    fullName: pending.full_name,
    phoneVerified: pending.phone_verified,
  });

  if (!profileOk) {
    return { ok: false, error: "Could not finish account setup" };
  }

  if (isReviewerAccountEmail(pending.email)) {
    await confirmReviewerEmail(pending.email);
  } else {
    await emailConfirmUser(db, pending.email);
  }

  await signupPendingDelete(db, pending.email);
  return { ok: true, userId: created.userId };
}
