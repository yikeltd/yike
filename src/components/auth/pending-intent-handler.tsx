"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  peekAuthIntent,
  clearAuthIntent,
  type AuthIntent,
} from "@/lib/auth-intent";
import { canListProperties } from "@/lib/utils";

async function executeIntent(intent: AuthIntent, router: ReturnType<typeof useRouter>) {
  const supabase = createClient();

  switch (intent.type) {
    case "whatsapp":
    case "call":
      if (intent.contactUrl) {
        if (intent.type === "call") {
          window.location.href = intent.contactUrl;
        } else {
          window.open(intent.contactUrl, "_blank", "noopener,noreferrer");
        }
      }
      break;
    case "save":
      if (intent.listingId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("favorites").upsert(
            { user_id: user.id, property_id: intent.listingId },
            { onConflict: "user_id,property_id", ignoreDuplicates: true }
          );
        }
      }
      if (intent.redirectPath) router.push(intent.redirectPath);
      break;
    case "profile":
      router.push("/agent");
      break;
    case "saved":
      router.push("/saved");
      break;
    case "list_property": {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) break;
      const { data: profile } = await supabase
        .from("profiles")
        .select("verification_status")
        .eq("id", user.id)
        .single();
      if (profile && canListProperties(profile.verification_status)) {
        router.push("/agent/listings/new");
      } else {
        router.push("/agent/verification");
      }
      break;
    }
    default:
      if (intent.redirectPath) router.push(intent.redirectPath);
  }
}

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
      await executeIntent(intent, router);
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
