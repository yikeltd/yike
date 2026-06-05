"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { peekAuthIntent, clearAuthIntent } from "@/lib/auth-intent";
import { executeAuthIntent } from "@/lib/execute-auth-intent";

/** Resume guest intent after login + email verification. */
export function PendingIntentHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const ran = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    if (pathname.startsWith("/auth")) return;

    const supabase = createClient();

    async function tryRun() {
      const intent = peekAuthIntent();
      if (!intent || ran.current) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email_confirmed_at) return;

      ran.current = true;
      clearAuthIntent();
      await executeAuthIntent(intent, router);
    }

    void tryRun();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email_confirmed_at) {
        ran.current = false;
        void tryRun();
      }
    });

    return () => subscription.unsubscribe();
  }, [router, pathname]);

  return null;
}
