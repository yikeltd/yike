import { createAdminClient } from "@/lib/supabase/admin";

export async function resolveLoginEmail(identifier: string): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const raw = identifier.trim();
  if (!raw) return null;

  if (raw.includes("@")) {
    const { data } = await admin
      .from("profiles")
      .select("email")
      .ilike("email", raw.toLowerCase())
      .maybeSingle();
    return data?.email?.trim().toLowerCase() ?? null;
  }

  const { data } = await admin
    .from("profiles")
    .select("email")
    .ilike("username", raw.toLowerCase())
    .maybeSingle();

  return data?.email?.trim().toLowerCase() ?? null;
}
