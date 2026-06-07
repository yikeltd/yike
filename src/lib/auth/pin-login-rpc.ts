import { createOtpDbClient } from "@/lib/otp/rpc";

export type PinLoginLookup = {
  user_id: string;
  email: string;
  pin_hash: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

function otpServerToken(): string {
  const t = process.env.YIKE_OTP_SERVER_TOKEN?.trim();
  if (!t) throw new Error("YIKE_OTP_SERVER_TOKEN not configured");
  return t;
}

export async function lookupPinLoginUser(
  identifier: string
): Promise<PinLoginLookup | null> {
  const client = createOtpDbClient();
  if (!client) return null;

  const { data, error } = await client.rpc("yike_pin_login_lookup", {
    p_token: otpServerToken(),
    p_identifier: identifier.trim(),
  });

  if (error) {
    console.error("[auth/pin-login] lookup failed:", error.message);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.user_id || !row?.pin_hash || !row?.email) return null;
  return row as PinLoginLookup;
}
