import Link from "next/link";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PropertyFeed } from "@/components/property/property-feed";
import { SavedEmptyLoggedIn } from "@/components/property/saved-empty-logged-in";
import { SavedGuestView } from "@/components/auth/saved-guest-view";
import type { Property } from "@/types/database";

export default async function SavedPage() {
  const user = await getSession();

  if (!user) {
    return (
      <div className="space-y-4 px-3 pt-2 pb-8">
        <h1 className="text-xl font-bold text-foreground">Saved homes</h1>
        <SavedGuestView />
      </div>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="px-3 pt-4">
        <h1 className="text-xl font-bold">Saved homes</h1>
        <PropertyFeed properties={[]} emptyMessage="Connect Supabase to sync saves." />
      </div>
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="px-3 pt-4">
        <h1 className="text-xl font-bold">Saved homes</h1>
        <PropertyFeed properties={[]} />
      </div>
    );
  }

  const { data } = await supabase
    .from("favorites")
    .select(
      `property:properties (
        *,
        agent:profiles!properties_agent_id_fkey (
          id, full_name, phone, whatsapp, avatar_url,
          verification_status, agent_type, role, verified_badge, ranking_score
        )
      )`
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const properties = ((data ?? []) as unknown as { property: Property }[])
    .map((f) => f.property)
    .filter((p) => p && p.status === "approved");

  return (
    <div className="space-y-4 px-3 pt-2">
      <h1 className="text-xl font-bold text-foreground">Saved homes</h1>
      {properties.length === 0 ? (
        <SavedEmptyLoggedIn />
      ) : (
        <PropertyFeed properties={properties} />
      )}
    </div>
  );
}
