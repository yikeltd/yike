import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizePhoneForDuplicateCheck } from "@/lib/phone";

/** Another profile already owns this normalized number (excluding current user). */
export async function isNormalizedPhoneTakenByOtherAccount(
  admin: SupabaseClient,
  phoneLocal: string,
  userId: string,
): Promise<boolean> {
  const normalized = normalizePhoneForDuplicateCheck(phoneLocal);
  if (!normalized) return false;

  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("normalized_phone", normalized)
    .neq("id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[phone-verification] duplicate check failed", error.message);
    return true;
  }

  return Boolean(data?.id);
}
