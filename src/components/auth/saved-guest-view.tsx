"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { PropertyFeed } from "@/components/property/property-feed";
import { getGuestFavoriteIds } from "@/lib/guest-favorites";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { MOCK_LISTINGS } from "@/lib/mock-listings";
import type { Property } from "@/types/database";

export function SavedGuestView() {
  const { openAuth } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const ids = getGuestFavoriteIds();
      if (ids.length === 0) {
        setProperties([]);
        setLoading(false);
        return;
      }

      const mock = MOCK_LISTINGS.filter((p) => ids.includes(p.id));
      if (!isSupabaseConfigured()) {
        setProperties(mock);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from("properties")
        .select(
          `*, agent:profiles!properties_agent_id_fkey (
            id, full_name, phone, whatsapp, avatar_url,
            verification_status, agent_type, role, verified_badge, ranking_score
          )`
        )
        .in("id", ids)
        .eq("status", "approved");

      const live = (data ?? []) as Property[];
      const byId = new Map([...mock, ...live].map((p) => [p.id, p]));
      setProperties(ids.map((id) => byId.get(id)).filter(Boolean) as Property[]);
      setLoading(false);
    }

    void load();
  }, []);

  if (loading) {
    return (
      <p className="px-3 py-8 text-center text-sm text-muted">Loading saved homes…</p>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-surface bg-elevated px-6 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15">
          <Heart className="h-7 w-7 text-gold-dark dark:text-gold" />
        </span>
        <h2 className="mt-4 text-lg font-bold text-foreground">Save homes you love</h2>
        <p className="mt-2 max-w-xs text-sm text-muted">
          Sign in to keep your favorite listings across devices.
        </p>
        <Button
          type="button"
          className="mt-6 rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-navy hover:bg-gold/90"
          onClick={() => openAuth({ type: "saved", redirectPath: "/saved" })}
        >
          Sign In
        </Button>
        <Link
          href="/browse"
          className="mt-3 text-sm font-semibold text-gold-dark hover:underline dark:text-gold"
        >
          Browse Homes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PropertyFeed properties={properties} />
      <div className="rounded-xl border border-surface bg-elevated px-4 py-3 text-center text-sm text-muted">
        Saved on this device.{" "}
        <Button
          type="button"
          variant="ghost"
          className="h-auto p-0 font-semibold text-gold-dark underline"
          onClick={() => openAuth({ type: "saved", redirectPath: "/saved" })}
        >
          Sign in to sync
        </Button>
      </div>
    </div>
  );
}
