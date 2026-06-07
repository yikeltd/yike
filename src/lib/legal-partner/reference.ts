import type { SupabaseClient } from "@supabase/supabase-js";
import { formatYlrReference } from "./code";

function randomDigits(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) out += String(Math.floor(Math.random() * 10));
  return out;
}

export async function generateUniqueYlrReference(
  client: SupabaseClient
): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const ref = formatYlrReference(randomDigits(6));
    const { data } = await client
      .from("legal_verification_requests")
      .select("id")
      .eq("request_reference", ref)
      .maybeSingle();
    if (!data) return ref;
  }
  return formatYlrReference(`${Date.now()}`.slice(-6));
}
