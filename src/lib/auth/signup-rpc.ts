import { createOtpDbClient } from "@/lib/otp/rpc";

function otpServerToken(): string {
  const t = process.env.YIKE_OTP_SERVER_TOKEN?.trim();
  if (!t) throw new Error("YIKE_OTP_SERVER_TOKEN not configured");
  return t;
}

export async function isUsernameAvailable(username: string): Promise<boolean | null> {
  const client = createOtpDbClient();
  if (!client) return null;

  const { data, error } = await client.rpc("yike_username_available", {
    p_token: otpServerToken(),
    p_username: username,
  });

  if (error) {
    console.error("[auth/signup-rpc] username check failed:", error.message);
    return null;
  }

  return Boolean(data);
}

export async function completeSignupProfile(params: {
  userId: string;
  username: string;
  pinHash: string;
  phone: string;
  fullName: string;
  phoneVerified?: boolean;
}): Promise<boolean> {
  const client = createOtpDbClient();
  if (!client) return false;

  const { error } = await client.rpc("yike_complete_signup", {
    p_token: otpServerToken(),
    p_user_id: params.userId,
    p_username: params.username,
    p_pin_hash: params.pinHash,
    p_phone: params.phone,
    p_full_name: params.fullName,
    p_phone_verified: params.phoneVerified ?? true,
  });

  if (error) {
    console.error("[auth/signup-rpc] complete signup failed:", error.message);
    return false;
  }

  return true;
}

export async function confirmReviewerEmail(email: string): Promise<boolean> {
  const client = createOtpDbClient();
  if (!client) return false;

  const { error } = await client.rpc("yike_auth_confirm_reviewer", {
    p_token: otpServerToken(),
    p_email: email,
  });

  if (error) {
    console.error("[auth/signup-rpc] confirm reviewer failed:", error.message);
    return false;
  }

  return true;
}
