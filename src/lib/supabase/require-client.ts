import { redirect } from "next/navigation";
import { createClient } from "./server";
import { isSupabaseConfigured } from "./config";

/** For routes that require a working Supabase connection. */
export async function requireServerClient() {
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = await createClient();
  if (!supabase) redirect("/");
  return supabase;
}
