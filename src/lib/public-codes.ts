import type { SupabaseClient } from "@supabase/supabase-js";
import { slugifyPublicName } from "@/lib/agent-slugs";

export function generatePublicListingCode(): string {
  const digits = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  return `yike${digits}`;
}

export function generatePublicAgentCode(
  profile: { public_slug?: string | null; full_name?: string | null; company_name?: string | null }
): string {
  const raw =
    profile.public_slug?.trim() ||
    slugifyPublicName(profile.company_name ?? profile.full_name ?? "agent");
  const prefix = raw.replace(/[^a-z0-9]/g, "").slice(0, 32) || "agent";
  const digits = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  return `${prefix}${digits}`;
}

export function generateLeadCode(): string {
  const digits = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  return `YKLD${digits}`;
}

export async function ensurePublicListingCode(
  admin: SupabaseClient,
  listingId: string
): Promise<string | null> {
  const { data } = await admin
    .from("properties")
    .select("public_listing_code")
    .eq("id", listingId)
    .maybeSingle();

  if (data?.public_listing_code) return data.public_listing_code as string;

  for (let i = 0; i < 8; i++) {
    const code = generatePublicListingCode();
    const { data: updated, error } = await admin
      .from("properties")
      .update({ public_listing_code: code })
      .eq("id", listingId)
      .is("public_listing_code", null)
      .select("public_listing_code")
      .maybeSingle();
    if (!error && updated?.public_listing_code) {
      return updated.public_listing_code as string;
    }
    const { data: refetch } = await admin
      .from("properties")
      .select("public_listing_code")
      .eq("id", listingId)
      .maybeSingle();
    if (refetch?.public_listing_code) return refetch.public_listing_code as string;
  }
  return null;
}

export async function ensurePublicAgentCode(
  admin: SupabaseClient,
  agentId: string
): Promise<string | null> {
  const { data: profile } = await admin
    .from("profiles")
    .select("public_agent_code, public_slug, full_name, company_name")
    .eq("id", agentId)
    .maybeSingle();

  if (!profile) return null;
  if (profile.public_agent_code) return profile.public_agent_code as string;

  for (let i = 0; i < 8; i++) {
    const code = generatePublicAgentCode(profile);
    const { data: updated, error } = await admin
      .from("profiles")
      .update({ public_agent_code: code })
      .eq("id", agentId)
      .is("public_agent_code", null)
      .select("public_agent_code")
      .maybeSingle();
    if (!error && updated?.public_agent_code) {
      return updated.public_agent_code as string;
    }
    const { data: refetch } = await admin
      .from("profiles")
      .select("public_agent_code")
      .eq("id", agentId)
      .maybeSingle();
    if (refetch?.public_agent_code) return refetch.public_agent_code as string;
  }
  return null;
}
