import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { clearAuthIntent } from "@/lib/auth-intent";
import { clearQuickLoginUser } from "@/lib/auth/quick-login";
import { clearListingDraft } from "@/lib/listing-draft";

const SIGN_OUT_TIMEOUT_MS = 1500;

/** Clear local session immediately; destroy server session & purge all cached storage. */
export async function performFastLogout(): Promise<void> {
  // 1. Clear app-level memory helpers
  clearQuickLoginUser();
  clearAuthIntent();
  clearListingDraft();

  // 2. Purge browser storage (localStorage & sessionStorage)
  if (typeof window !== "undefined") {
    try {
      window.localStorage.clear();
    } catch {
      /* ignore storage clear errors */
    }
    try {
      window.sessionStorage.clear();
    } catch {
      /* ignore storage clear errors */
    }
  }

  // 3. Server-side logout endpoint to wipe cookies
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      cache: "no-store",
    });
  } catch {
    /* best-effort endpoint call */
  }

  if (!isSupabaseConfigured()) return;

  // 4. Supabase client signout
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
