import { createAdminClient } from "@/lib/supabase/admin";
import { validateUsername, normalizeUsername } from "./rules";

export const USERNAME_CHANGE_MIN_DAYS = 14;

export type SetUsernameResult =
  | { ok: true; username: string; alreadySet: boolean }
  | { ok: false; error: string; code: string };

function mapUsernameRpcError(message: string | undefined): { error: string; code: string } {
  const msg = message ?? "";
  if (msg.includes("username_taken")) {
    return { error: "That username is taken", code: "username_taken" };
  }
  if (msg.includes("username_change_rate_limited")) {
    return {
      error: `You can change your username again in ${USERNAME_CHANGE_MIN_DAYS} days`,
      code: "rate_limited",
    };
  }
  if (msg.includes("username_already_set")) {
    return { error: "You already have a username", code: "already_set" };
  }
  if (msg.includes("invalid_username_format")) {
    return { error: "Enter a valid username", code: "format" };
  }
  if (msg.includes("username_change_forbidden")) {
    return { error: "Username cannot be changed this way", code: "forbidden" };
  }
  return { error: "Could not save username", code: "update_failed" };
}

export async function setProfileUsername(
  userId: string,
  rawUsername: string,
  options?: { allowReplace?: boolean }
): Promise<SetUsernameResult> {
  const validated = validateUsername(rawUsername);
  if (!validated.ok) {
    return { ok: false, error: validated.error, code: validated.code };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, error: "Unavailable", code: "unavailable" };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  const current = profile?.username ? normalizeUsername(profile.username) : null;
  if (current === validated.username) {
    return { ok: true, username: validated.username, alreadySet: true };
  }

  const { data, error } = await admin.rpc("yike_profile_set_username", {
    p_user_id: userId,
    p_username: validated.username,
    p_allow_change: Boolean(options?.allowReplace),
  });

  if (error?.message?.includes("Could not find the function")) {
    return legacySetProfileUsername(admin, userId, validated.username, current, options);
  }

  if (error) {
    return { ok: false, ...mapUsernameRpcError(error.message) };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const saved = row?.username ? normalizeUsername(String(row.username)) : validated.username;
  return { ok: true, username: saved, alreadySet: false };
}

/** Pre-guard-migration fallback — removed once 20261026140000 is applied everywhere. */
async function legacySetProfileUsername(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  userId: string,
  username: string,
  current: string | null,
  options?: { allowReplace?: boolean }
): Promise<SetUsernameResult> {
  if (current && !options?.allowReplace) {
    return { ok: false, error: "You already have a username", code: "already_set" };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("username_updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (current && profile?.username_updated_at) {
    const last = new Date(profile.username_updated_at).getTime();
    const minMs = USERNAME_CHANGE_MIN_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() - last < minMs) {
      return {
        ok: false,
        error: `You can change your username again in ${USERNAME_CHANGE_MIN_DAYS} days`,
        code: "rate_limited",
      };
    }
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ username, username_updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (updateError) {
    if (updateError.message.includes("unique") || updateError.message.includes("duplicate")) {
      return { ok: false, error: "That username is taken", code: "username_taken" };
    }
    return { ok: false, error: "Could not save username", code: "update_failed" };
  }

  return { ok: true, username, alreadySet: false };
}

export function nextUsernameChangeAt(usernameUpdatedAt: string | null): Date | null {
  if (!usernameUpdatedAt) return null;
  const last = new Date(usernameUpdatedAt).getTime();
  if (Number.isNaN(last)) return null;
  return new Date(last + USERNAME_CHANGE_MIN_DAYS * 24 * 60 * 60 * 1000);
}
