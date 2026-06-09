import { createVerifiedAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import {
  HOMEPAGE_HERO_TRUSTED_AGENTS_KEY,
  getDefaultHeroTrustedAgentsConfig,
  mergeHeroTrustedAgentsConfig,
  parseHeroTrustedAgentsConfig,
  type HeroTrustedAgent,
  type HeroTrustedAgentsConfig,
} from "@/lib/home/hero-trusted-agents";

export {
  HOMEPAGE_HERO_TRUSTED_AGENTS_KEY,
  type HeroTrustedAgent,
  type HeroTrustedAgentsConfig,
} from "@/lib/home/hero-trusted-agents";

export async function getHomepageHeroTrustedAgentsSetting(): Promise<HeroTrustedAgentsConfig | null> {
  if (!isAdminClientConfigured()) return null;
  const supabase = await createVerifiedAdminClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", HOMEPAGE_HERO_TRUSTED_AGENTS_KEY)
    .maybeSingle();

  if (!data?.value) return null;
  return mergeHeroTrustedAgentsConfig(parseHeroTrustedAgentsConfig(data.value));
}

export async function setHomepageHeroTrustedAgentsSetting(
  config: HeroTrustedAgentsConfig,
  updatedBy: string
): Promise<void> {
  const supabase = await createVerifiedAdminClient();
  if (!supabase) throw new Error("Database unavailable");

  await supabase.from("platform_settings").upsert({
    key: HOMEPAGE_HERO_TRUSTED_AGENTS_KEY,
    value: config,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  });
}

type StoredHeroTrustedAgents = {
  headlineTop?: string;
  headlineBottom?: string;
  overflowLabel?: string;
  maxVisible?: number;
  agents?: HeroTrustedAgent[];
  /** Admin-selected performing agent profile IDs (resolved server-side). */
  agentProfileIds?: string[];
};

async function resolveAgentProfiles(
  profileIds: string[]
): Promise<HeroTrustedAgent[]> {
  if (!isAdminClientConfigured() || profileIds.length === 0) return [];
  const supabase = await createVerifiedAdminClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, is_verified_agent, verified_badge")
    .in("id", profileIds.slice(0, 8));

  const byId = new Map((data ?? []).map((row) => [row.id as string, row]));

  return profileIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((row) => {
      const name =
        (row!.full_name as string | null)?.trim() ||
        (row!.username as string | null)?.trim() ||
        "Verified agent";
      return {
        id: row!.id as string,
        profileId: row!.id as string,
        profileSlug: (row!.username as string | null) ?? null,
        name,
        avatarUrl: (row!.avatar_url as string | null) ?? null,
        verified: Boolean(row!.is_verified_agent || row!.verified_badge),
      } satisfies HeroTrustedAgent;
    });
}

/**
 * Homepage hero trusted agents — admin can set `homepage_hero_trusted_agents`
 * in platform_settings with `agentProfileIds` or explicit `agents`.
 */
export async function getHomeHeroTrustedAgentsConfig(): Promise<HeroTrustedAgentsConfig> {
  if (!isAdminClientConfigured()) return getDefaultHeroTrustedAgentsConfig();

  const supabase = await createVerifiedAdminClient();
  if (!supabase) return getDefaultHeroTrustedAgentsConfig();

  const { data } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", HOMEPAGE_HERO_TRUSTED_AGENTS_KEY)
    .maybeSingle();

  const stored = data?.value as StoredHeroTrustedAgents | null;
  if (!stored) return getDefaultHeroTrustedAgentsConfig();

  const parsed = parseHeroTrustedAgentsConfig(stored);
  let agents = parsed?.agents ?? [];

  if (agents.length === 0 && Array.isArray(stored.agentProfileIds)) {
    agents = await resolveAgentProfiles(stored.agentProfileIds);
  }

  return mergeHeroTrustedAgentsConfig({
    ...parsed,
    agents,
  });
}
