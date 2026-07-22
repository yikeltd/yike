"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  isGuestFavorite,
  toggleGuestFavorite,
} from "@/lib/guest-favorites";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";

export function ListingSaveButton({
  listingId,
  className,
}: {
  listingId: string;
  className?: string;
}) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) {
        setSaved(isGuestFavorite(listingId));
        return;
      }
      const supabase = createClient();
      if (!supabase) return;
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("property_id", listingId)
        .maybeSingle();
      if (!cancelled) setSaved(Boolean(data));
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [listingId, user]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    if (!user) {
      setSaved(toggleGuestFavorite(listingId));
      setBusy(false);
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setBusy(false);
      return;
    }
    if (saved) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("property_id", listingId);
      setSaved(false);
    } else {
      await supabase.from("favorites").insert({
        user_id: user.id,
        property_id: listingId,
      });
      setSaved(true);
    }
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={busy}
      aria-label={saved ? "Remove from saved" : "Save listing"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-navy/12 bg-white px-3 py-1.5 text-xs font-bold text-navy",
        className,
      )}
    >
      <Heart
        className={cn("h-4 w-4", saved ? "fill-gold text-gold" : "text-navy/50")}
      />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
