"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  USER_ACTIVITY_META_KEY,
  applyActivitySnapshot,
  collectLocalActivity,
  mergeActivitySnapshots,
  parseActivitySnapshot,
} from "@/lib/user-activity";
import { syncSearchPrefCookies } from "@/lib/search-pref-cookies";

/** Sync browse prefs, searches, and viewed listings for logged-in users. */
export function UserActivitySync() {
  const synced = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured() || synced.current) return;
    const supabase = createClient();

    async function sync() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      synced.current = true;
      const local = collectLocalActivity();
      const remote = parseActivitySnapshot(
        user.user_metadata?.[USER_ACTIVITY_META_KEY]
      );
      const merged = remote
        ? mergeActivitySnapshots(local, remote)
        : local;

      applyActivitySnapshot(merged);
      syncSearchPrefCookies({
        city: merged.browsePrefs?.cities[0],
        area: merged.browsePrefs?.areas[0],
        listingType: merged.browsePrefs?.listingTypes[0],
      });

      if (merged.updatedAt > (remote?.updatedAt ?? 0)) {
        await supabase.auth.updateUser({
          data: { [USER_ACTIVITY_META_KEY]: merged },
        });
      }
    }

    void sync();

    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedulePush = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const snapshot = collectLocalActivity();
        await supabase.auth.updateUser({
          data: { [USER_ACTIVITY_META_KEY]: snapshot },
        });
      }, 4000);
    };

    window.addEventListener("yike:activity-changed", schedulePush);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        synced.current = false;
        void sync();
      }
    });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("yike:activity-changed", schedulePush);
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
