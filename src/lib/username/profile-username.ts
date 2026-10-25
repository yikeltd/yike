import { createAdminClient } from "@/lib/supabase/admin";
import { validateUsername, normalizeUsername } from "./rules";

const USERNAME_CHANGE_MIN_DAYS = 14;

export type SetUsernameResult =
  | { ok: true; username: string; alreadySet: boolean }
  | { ok: false; error: string; code: string };

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

  const { data: profile, error: readError } = await admin
    .from("profiles")
    .select("username, username_updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (readError || !profile) {
    return { ok: false, error: "Profile not found", code: "not_found" };
  }

  const current = profile.username ? normalizeUsername(profile.username) : null;
  if (current === validated.username) {
    return { ok: true, username: validated.username, alreadySet: true };
  }

  if (current && !options?.allowReplace) {
    return { ok: false, error: "You already have a username", code: "already_set" };
  }

  if (current && profile.username_updated_at) {
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

  const { data: taken } = await admin
    .from("profiles")
    .select("id")
    .ilike("username", validated.username)
    .neq("id", userId)
    .limit(1);

  if (taken && taken.length > 0) {
    return { ok: false, error: "That username is taken", code: "username_taken" };
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      username: validated.username,
      username_updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) {
    if (updateError.message.includes("unique") || updateError.message.includes("duplicate")) {
      return { ok: false, error: "That username is taken", code: "username_taken" };
    }
    return { ok: false, error: "Could not save username", code: "update_failed" };
  }

  return { ok: true, username: validated.username, alreadySet: false };
}
