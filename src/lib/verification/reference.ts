import type { SupabaseClient } from "@supabase/supabase-js";
import { YVR_PREFIX } from "./constants";

function randomDigits(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += String(Math.floor(Math.random() * 10));
  }
  return out;
}

export function formatYvrReference(digits: string): string {
  return `${YVR_PREFIX}-${digits}`;
}

export async function generateUniqueYvrReference(
  client: SupabaseClient
): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const ref = formatYvrReference(randomDigits(6));
    const { data } = await client
      .from("property_verification_requests")
      .select("id")
      .eq("request_reference", ref)
      .maybeSingle();
    if (!data) return ref;
  }
  return formatYvrReference(`${Date.now()}`.slice(-6));
}

export function whatsappContactUrl(phone: string, message: string): string {
  const normalized = phone.replace(/\D/g, "");
  const withCountry =
    normalized.startsWith("234") || normalized.startsWith("0")
      ? normalized.startsWith("0")
        ? `234${normalized.slice(1)}`
        : normalized
      : `234${normalized}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

export function buyerWhatsAppPrefill(reference: string): string {
  return `Hello, this is Yike regarding your property verification request (${reference}). We'd like to confirm a few details before proceeding.`;
}
