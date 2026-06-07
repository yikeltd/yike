import type { SupabaseClient, User } from "@supabase/supabase-js";

/** Lookup auth user by email via admin API (paginated). */
export async function findAuthUserByEmail(
  admin: SupabaseClient,
  email: string
): Promise<User | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  let page = 1;
  const perPage = 200;

  while (page <= 25) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("[auth] listUsers failed:", error.message);
      return null;
    }

    const match = data.users.find(
      (u) => u.email?.trim().toLowerCase() === normalized
    );
    if (match) return match;

    if (data.users.length < perPage) break;
    page += 1;
  }

  return null;
}
