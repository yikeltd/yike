import type { SupabaseClient } from "@supabase/supabase-js";
import { findAuthUserByEmail } from "@/lib/auth/find-auth-user";
import type { Profile } from "@/types/database";

export type ProfileRepairResult =
  | { ok: true; userId: string; created: boolean }
  | { ok: false; error: string };

function metaString(meta: Record<string, unknown> | undefined, key: string): string {
  const v = meta?.[key];
  return typeof v === "string" ? v.trim() : "";
}

export async function repairUserProfile(
  admin: SupabaseClient,
  params: { userId?: string; email?: string }
): Promise<ProfileRepairResult> {
  let userId = params.userId?.trim();
  let authEmail = params.email?.trim().toLowerCase() ?? "";
  let meta: Record<string, unknown> = {};

  if (!userId && authEmail) {
    const authUser = await findAuthUserByEmail(admin, authEmail);
    if (!authUser) {
      return { ok: false, error: "No auth user found for this email" };
    }
    userId = authUser.id;
    authEmail = authUser.email?.toLowerCase() ?? authEmail;
    meta = (authUser.user_metadata as Record<string, unknown>) ?? {};
  }

  if (!userId) {
    return { ok: false, error: "userId or email required" };
  }

  if (!authEmail) {
    const { data: authData } = await admin.auth.admin.getUserById(userId);
    authEmail = authData.user?.email?.toLowerCase() ?? "";
    meta = (authData.user?.user_metadata as Record<string, unknown>) ?? meta;
  }

  const { data: existing } = await admin
    .from("profiles")
    .select("id, full_name, username, email, role, account_status, deleted_at")
    .eq("id", userId)
    .maybeSingle();

  const fullName =
    existing?.full_name?.trim() ||
    metaString(meta, "full_name") ||
    metaString(meta, "name") ||
    null;
  const username =
    existing?.username?.trim() || metaString(meta, "username") || null;
  const phone = metaString(meta, "phone") || null;

  if (existing) {
    const patch: Partial<Profile> & Record<string, unknown> = {
      email: existing.email ?? authEmail ?? null,
      full_name: fullName,
      account_status:
        existing.deleted_at || existing.account_status === "deleted"
          ? existing.account_status
          : existing.account_status ?? "active",
      is_banned: false,
    };
    if (username && !existing.username) patch.username = username;
    if (phone) {
      patch.phone = phone;
      patch.whatsapp = phone;
    }

    const { error } = await admin.from("profiles").update(patch).eq("id", userId);
    if (error) {
      console.error("[profile-repair] update failed:", error.message);
      return { ok: false, error: "Could not repair profile" };
    }

    await admin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    return { ok: true, userId, created: false };
  }

  const { error: insertError } = await admin.from("profiles").insert({
    id: userId,
    email: authEmail || null,
    full_name: fullName,
    username,
    phone,
    whatsapp: phone,
    role: "user",
    verification_status: "not_started",
    account_status: "active",
    email_verified: true,
    phone_verified: false,
    is_banned: false,
  });

  if (insertError) {
    console.error("[profile-repair] insert failed:", insertError.message);
    return { ok: false, error: "Could not create profile" };
  }

  await admin.auth.admin.updateUserById(userId, { email_confirm: true });

  return { ok: true, userId, created: true };
}

export async function countAuthProfileGap(
  admin: SupabaseClient
): Promise<{ authCount: number; profileCount: number; missingCount: number }> {
  const { count: profileCount } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true });

  let authCount = 0;
  const profileIds = new Set<string>();
  let page = 1;

  while (page <= 50) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    for (const u of data.users) {
      authCount += 1;
      profileIds.add(u.id);
    }
    if (data.users.length < 200) break;
    page += 1;
  }

  const { data: profiles } = await admin.from("profiles").select("id");
  const missing = [...profileIds].filter(
    (id) => !(profiles ?? []).some((p) => p.id === id)
  );

  // Recompute missing properly
  const profileIdSet = new Set((profiles ?? []).map((p) => p.id as string));
  let missingCount = 0;
  page = 1;
  while (page <= 50) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (!data) break;
    for (const u of data.users) {
      if (!profileIdSet.has(u.id)) missingCount += 1;
    }
    if (data.users.length < 200) break;
    page += 1;
  }

  return {
    authCount,
    profileCount: profileCount ?? 0,
    missingCount,
  };
}

export async function repairAllMissingProfiles(
  admin: SupabaseClient
): Promise<{ repaired: number; failed: number }> {
  const { data: profiles } = await admin.from("profiles").select("id");
  const profileIdSet = new Set((profiles ?? []).map((p) => p.id as string));

  let repaired = 0;
  let failed = 0;
  let page = 1;

  while (page <= 50) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (!data) break;

    for (const u of data.users) {
      if (profileIdSet.has(u.id)) continue;
      const result = await repairUserProfile(admin, { userId: u.id, email: u.email });
      if (result.ok) repaired += 1;
      else failed += 1;
    }

    if (data.users.length < 200) break;
    page += 1;
  }

  return { repaired, failed };
}
