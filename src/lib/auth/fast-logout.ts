import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { clearAuthIntent } from "@/lib/auth-intent";
import { clearQuickLoginUser } from "@/lib/auth/quick-login";
import { clearListingDraft } from "@/lib/listing-draft";

const SIGN_OUT_TIMEOUT_MS = 1500;

/** Clear local session immediately; best-effort global revoke with timeout. */
export async function performFastLogout(): Promise<void> {
  clearQuickLoginUser();
  clearAuthIntent();
  clearListingDraft();

  if (!isSupabaseConfigured()) return;

  const supabase = createClient();

  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    /* local clear is best-effort */
  }

  const globalSignOut = supabase.auth.signOut({ scope: "global" });
  await Promise.race([
    globalSignOut.catch(() => undefined),
    new Promise<void>((resolve) => {
      setTimeout(resolve, SIGN_OUT_TIMEOUT_MS);
    }),
  ]);
}
