export type HeroTrustedAgent = {
  id: string;
  /** Optional profile UUID when admin pins a performing agent. */
  profileId?: string | null;
  /** Public profile slug for linking to /agents/[slug]. */
  profileSlug?: string | null;
  name: string;
  city?: string;
  avatarUrl?: string | null;
  verified?: boolean;
};

export type HeroTrustedAgentsConfig = {
  headlineTop: string;
  headlineBottom: string;
  /** Shown on the trailing avatar chip, e.g. "+2K". */
  overflowLabel: string;
  agents: HeroTrustedAgent[];
  maxVisible?: number;
};

export const HOMEPAGE_HERO_TRUSTED_AGENTS_KEY = "homepage_hero_trusted_agents";

const SAMPLE_AVATARS = [
  "/images/hero/agents/sample-1.webp",
  "/images/hero/agents/sample-2.webp",
  "/images/hero/agents/sample-3.webp",
  "/images/hero/agents/sample-4.webp",
] as const;

/** Fallback until admin selects top-performing agents in platform settings. */
export function getDefaultHeroTrustedAgentsConfig(): HeroTrustedAgentsConfig {
  return {
    headlineTop: "Trusted by thousands",
    headlineBottom: "across Nigeria",
    overflowLabel: "+2K",
    maxVisible: 4,
    agents: [
      {
        id: "sample-tunde",
        name: "Tunde A.",
        city: "Lagos",
        avatarUrl: SAMPLE_AVATARS[0],
        verified: true,
      },
      {
        id: "sample-amaka",
        name: "Amaka O.",
        city: "Abuja",
        avatarUrl: SAMPLE_AVATARS[1],
        verified: true,
      },
      {
        id: "sample-chinedu",
        name: "Chinedu E.",
        city: "Port Harcourt",
        avatarUrl: SAMPLE_AVATARS[2],
        verified: true,
      },
      {
        id: "sample-bola",
        name: "Bola S.",
        city: "Ibadan",
        avatarUrl: SAMPLE_AVATARS[3],
        verified: true,
      },
    ],
  };
}

/** Client-safe fallback when server config is not passed. */
export function getHeroTrustedAgentsConfig(): HeroTrustedAgentsConfig {
  return getDefaultHeroTrustedAgentsConfig();
}

export function parseHeroTrustedAgentsConfig(
  raw: unknown
): Partial<HeroTrustedAgentsConfig> | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const agentsRaw = value.agents;
  const agents = Array.isArray(agentsRaw)
    ? (agentsRaw
        .map((entry, index): HeroTrustedAgent | null => {
          if (!entry || typeof entry !== "object") return null;
          const row = entry as Record<string, unknown>;
          const profileId =
            typeof row.profileId === "string" ? row.profileId : undefined;
          const profileSlug =
            typeof row.profileSlug === "string" ? row.profileSlug : undefined;
          const id =
            typeof row.id === "string"
              ? row.id
              : profileId ?? `agent-${index}`;
          const name = typeof row.name === "string" ? row.name.trim() : "";
          if (!name && !profileId) return null;
          return {
            id,
            profileId,
            profileSlug,
            name: name || "Verified agent",
            city: typeof row.city === "string" ? row.city : undefined,
            avatarUrl:
              typeof row.avatarUrl === "string" ? row.avatarUrl : null,
            verified: row.verified !== false,
          };
        })
        .filter((row): row is HeroTrustedAgent => row !== null))
    : undefined;

  return {
    headlineTop:
      typeof value.headlineTop === "string" ? value.headlineTop : undefined,
    headlineBottom:
      typeof value.headlineBottom === "string"
        ? value.headlineBottom
        : undefined,
    overflowLabel:
      typeof value.overflowLabel === "string"
        ? value.overflowLabel
        : undefined,
    maxVisible:
      typeof value.maxVisible === "number" ? value.maxVisible : undefined,
    agents,
  };
}

export function mergeHeroTrustedAgentsConfig(
  partial: Partial<HeroTrustedAgentsConfig> | null | undefined
): HeroTrustedAgentsConfig {
  const defaults = getDefaultHeroTrustedAgentsConfig();
  if (!partial) return defaults;

  return {
    headlineTop: partial.headlineTop?.trim() || defaults.headlineTop,
    headlineBottom:
      partial.headlineBottom?.trim() || defaults.headlineBottom,
    overflowLabel: partial.overflowLabel?.trim() || defaults.overflowLabel,
    maxVisible: partial.maxVisible ?? defaults.maxVisible,
    agents:
      partial.agents && partial.agents.length > 0
        ? partial.agents
        : defaults.agents,
  };
}
