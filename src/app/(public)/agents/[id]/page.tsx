import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PropertyFeed } from "@/components/property/property-feed";
import { VerifiedBadge } from "@/components/ui/badge";
import { isVerifiedAgent } from "@/lib/utils";
import Image from "next/image";
import type { Property, Profile } from "@/types/database";

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isSupabaseConfigured()) notFound();

  const supabase = await createClient();
  if (!supabase) notFound();

  const { data: agent } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("is_banned", false)
    .single();

  if (!agent) notFound();

  const profile = agent as Profile;
  const { data: listings } = await supabase
    .from("properties")
    .select(
      `*, agent:profiles!properties_agent_id_fkey (id, full_name, phone, whatsapp, avatar_url, verification_status, agent_type, role)`
    )
    .eq("agent_id", id)
    .eq("status", "approved")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  const verified = isVerifiedAgent(profile.verification_status);

  return (
    <div className="space-y-6 px-3 pt-2">
      <div className="flex items-center gap-4 rounded-2xl bg-elevated p-4 shadow-float">
        <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-surface">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name ?? "Agent"}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-gold">
              {(profile.full_name ?? "A").charAt(0)}
            </span>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {profile.full_name ?? "Agent"}
          </h1>
          {profile.agent_type && (
            <p className="text-sm capitalize text-muted">
              {profile.agent_type}
            </p>
          )}
          {verified && <VerifiedBadge className="mt-2" />}
        </div>
      </div>
      <section>
        <h2 className="mb-3 px-1 text-sm font-bold text-foreground">
          Listings
        </h2>
        <PropertyFeed
          properties={(listings ?? []) as Property[]}
          emptyMessage="No active listings from this agent."
        />
      </section>
    </div>
  );
}
