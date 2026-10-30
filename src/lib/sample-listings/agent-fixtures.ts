import type { Profile } from "@/types/database";
import { SAMPLE_SELLERS } from "./catalog";

const AVATARS: Record<string, string> = {
  "s1000001-0000-4000-8000-000000000001":
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop",
  "s1000001-0000-4000-8000-000000000002":
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
  "s1000001-0000-4000-8000-000000000003":
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
};

function baseAgent(def: (typeof SAMPLE_SELLERS)[number], extra: Partial<Profile>): Profile {
  const slug = def.full_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48);
  return {
    id: def.id,
    full_name: def.full_name,
    username: slug,
    email: def.email,
    phone: def.phone,
    phone_verified: true,
    email_verified: true,
    whatsapp: def.phone,
    avatar_url: AVATARS[def.id] ?? null,
    role: "agent_verified",
    verification_status: "approved",
    agent_type: "agency",
    trust_score: 82,
    listing_limit: 10,
    ranking_score: 80,
    verified_badge: true,
    is_banned: false,
    plan: "pro",
    plan_expires_at: null,
    inquiry_count: 14,
    avg_response_time_minutes: 35,
    response_rate: 0.92,
    performance_score: 86,
    company_name: def.full_name,
    account_type: "dealer",
    public_slug: slug,
    ...extra,
  } as Profile;
}

const AGENT_BY_ID: Record<string, Profile> = {
  [SAMPLE_SELLERS[0].id]: baseAgent(SAMPLE_SELLERS[0], {
    performance_score: 88,
    avg_response_time_minutes: 28,
  }),
  [SAMPLE_SELLERS[1].id]: baseAgent(SAMPLE_SELLERS[1], {
    performance_score: 91,
    avg_response_time_minutes: 22,
  }),
  [SAMPLE_SELLERS[2].id]: baseAgent(SAMPLE_SELLERS[2], {
    performance_score: 74,
    inquiry_count: 3,
    avg_response_time_minutes: null,
    verified_badge: false,
    role: "agent_unverified",
    verification_status: "not_started",
  }),
};

export function getSampleAgentProfile(agentId: string): Profile | null {
  return AGENT_BY_ID[agentId] ?? null;
}
