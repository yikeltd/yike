import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPin } from "@/lib/pin";

export const ADMIN_PIN_COOKIE = "yike_admin_pin_session";
export const PIN_SESSION_MINUTES = 10;

export async function verifyAdminPin(
  userId: string,
  pin: string,
  storedHash: string | null | undefined
): Promise<boolean> {
  if (!storedHash) return false;
  return verifyPin(pin, storedHash);
}

export async function createPinSession(userId: string): Promise<string> {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  const expiresAt = new Date(Date.now() + PIN_SESSION_MINUTES * 60 * 1000);

  const { data, error } = await supabase
    .from("admin_pin_sessions")
    .insert({ user_id: userId, expires_at: expiresAt.toISOString() })
    .select("id")
    .single();

  if (error || !data) throw new Error("Failed to create PIN session");

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_PIN_COOKIE, data.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });

  return data.id;
}

export async function hasValidPinSession(userId: string): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(ADMIN_PIN_COOKIE)?.value;
  if (!sessionId) return false;

  const supabase = createAdminClient();
  if (!supabase) return false;

  const { data } = await supabase
    .from("admin_pin_sessions")
    .select("id, expires_at")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return false;
  return new Date(data.expires_at) > new Date();
}

export async function clearPinSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(ADMIN_PIN_COOKIE)?.value;
  cookieStore.delete(ADMIN_PIN_COOKIE);

  if (!sessionId) return;
  const supabase = createAdminClient();
  if (!supabase) return;
  await supabase.from("admin_pin_sessions").delete().eq("id", sessionId);
}
