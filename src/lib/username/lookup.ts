import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUsername, validateUsername } from "./rules";

export type UsernameLookupResult =
  | {
      ok: true;
      username: string;
      displayName: string;
      avatarUrl: string | null;
    }
  | { ok: false; error: string; code: string };

/** Exact username match for transfer confirmation — no email/phone. */
export async function lookupUsernameForTransfer(
  rawUsername: string
): Promise<UsernameLookupResult> {
  const validated = validateUsername(rawUsername);
  if (!validated.ok) {
    return { ok: false, error: "Enter a valid username", code: validated.code };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, error: "Unavailable", code: "unavailable" };
  }

  const { data, error } = await admin
    .from("profiles")
    .select("id, username, full_name, avatar_url, is_banned")
    .ilike("username", validated.username)
    .limit(2);

  if (error) {
    return { ok: false, error: "Lookup failed", code: "lookup_failed" };
  }

  const rows = data ?? [];
  const match = rows.find(
    (r) => normalizeUsername(String(r.username ?? "")) === validated.username
  );

  if (!match || match.is_banned) {
    return { ok: false, error: "No user found with that username", code: "not_found" };
  }

  const fullName = String(match.full_name ?? "").trim();
  const displayName = fullName || `@${validated.username}`;

  return {
    ok: true,
    username: validated.username,
    displayName,
    avatarUrl: match.avatar_url ? String(match.avatar_url) : null,
  };
}

export async function resolveUserIdByUsername(rawUsername: string): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const validated = validateUsername(rawUsername);
  if (!validated.ok) return null;

  const { data } = await admin.rpc("yike_resolve_profile_id_by_username", {
    p_username: validated.username,
  });
  return typeof data === "string" ? data : null;
}
