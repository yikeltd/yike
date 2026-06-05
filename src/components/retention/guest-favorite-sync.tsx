"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { clearGuestFavorites, getGuestFavoriteIds } from "@/lib/guest-favorites";

/** Merge local guest saves into Supabase after login. */
export function GuestFavoriteSync() {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    let cancelled = false;

    async function sync() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const ids = getGuestFavoriteIds();
      if (ids.length === 0) return;

      for (const property_id of ids) {
        await supabase.from("favorites").upsert(
          { user_id: user.id, property_id },
          { onConflict: "user_id,property_id", ignoreDuplicates: true }
        );
      }

      clearGuestFavorites();
    }

    void sync();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void sync();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
