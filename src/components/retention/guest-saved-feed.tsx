"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MOCK_LISTINGS } from "@/lib/mock-listings";
import { getGuestFavoriteIds } from "@/lib/guest-favorites";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PropertyCard } from "@/components/property/property-card";
import type { Property } from "@/types/database";

const SELECT = `
  *,
  agent:profiles!properties_agent_id_fkey (
    id, full_name, phone, whatsapp, avatar_url,
    verification_status, agent_type, role
  )
`;

export function GuestSavedFeed() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const ids = getGuestFavoriteIds();
      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { data } = await supabase
          .from("properties")
          .select(SELECT)
          .in("id", ids)
          .eq("status", "approved");
        const rows = (data ?? []) as Property[];
        if (rows.length > 0) {
          setProperties(rows);
          setLoading(false);
          return;
        }
      }

      setProperties(MOCK_LISTINGS.filter((p) => ids.includes(p.id)));
      setLoading(false);
    }
    void load();
  }, []);

  if (loading) {
    return <p className="text-sm text-muted">Loading saved homes…</p>;
  }

  if (properties.length === 0) {
    return (
      <div className="space-y-4 pt-4 text-center">
        <p className="text-sm text-muted">
          No saved homes yet. Tap the heart on any listing to save it here.
        </p>
        <Link
          href="/explore"
          className="pressable inline-flex h-11 items-center justify-center rounded-xl bg-gold px-6 text-sm font-bold text-navy"
        >
          Browse real listings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Saved on this device.{" "}
        <Link href="/auth/login?next=/saved" className="font-semibold text-gold-dark">
          Sign in
        </Link>{" "}
        to sync across phones.
      </p>
      <div className="space-y-4">
        {properties.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
    </div>
  );
}
