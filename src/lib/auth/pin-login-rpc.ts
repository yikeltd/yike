import { createAdminClient } from "@/lib/supabase/admin";
import { createOtpDbClient } from "@/lib/otp/rpc";

export type PinLoginLookup = {
  user_id: string;
  email: string;
  pin_hash: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

function otpServerToken(): string | null {
  return process.env.YIKE_OTP_SERVER_TOKEN?.trim() || null;
}

async function lookupViaRpc(identifier: string): Promise<PinLoginLookup | null> {
  const token = otpServerToken();
  if (!token) return null;

  const client = createOtpDbClient();
  if (!client) return null;

  const { data, error } = await client.rpc("yike_pin_login_lookup", {
    p_token: token,
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

async function lookupViaAdmin(identifier: string): Promise<PinLoginLookup | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const id = identifier.trim();
  const isEmail = id.includes("@");

  let query = admin
    .from("profiles")
    .select("id, email, pin_hash, full_name, username, avatar_url, is_banned")
    .not("pin_hash", "is", null)
    .eq("is_banned", false)
    .limit(1);

  query = isEmail
    ? query.ilike("email", id.toLowerCase())
    : query.ilike("username", id.toLowerCase());

  const { data } = await query.maybeSingle();
  if (!data?.id || !data.pin_hash || !data.email) return null;

  return {
    user_id: data.id,
    email: data.email,
    pin_hash: data.pin_hash,
    full_name: data.full_name,
    username: data.username,
    avatar_url: data.avatar_url,
  };
}

export async function lookupPinLoginUser(
  identifier: string
): Promise<PinLoginLookup | null> {
  const viaRpc = await lookupViaRpc(identifier);
  if (viaRpc) return viaRpc;
  return lookupViaAdmin(identifier);
}
