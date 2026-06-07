import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import type { Property, Profile } from "@/types/database";
import { isVerifiedAgentProfile } from "@/lib/agent-tiers";
import {
  computeListingFreshness,
  computeListingHealth,
} from "@/lib/trust/quality";
import { computeListingConfidence } from "@/lib/trust/confidence";
import { analyzeImageQuality } from "@/lib/trust/image-quality";

export type DuplicateCandidate = {
  id: string;
  title: string;
  agent_id: string;
  city: string;
  area: string;
  price: number;
  confidence: number;
  group_id: string;
};

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function titleSimilarity(a: string, b: string): number {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const wordsA = new Set(na.split(" ").filter((w) => w.length > 2));
  const wordsB = new Set(nb.split(" ").filter((w) => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  return overlap / Math.max(wordsA.size, wordsB.size);
}

/** Batch scan — not for hot request paths. */
export async function scanListingDuplicates(
  admin: SupabaseClient,
  limit = 150
): Promise<number> {
  const { data } = await admin
    .from("properties")
    .select("id, title, agent_id, city, area, price, status, media_urls")
    .in("status", ["approved", "pending", "flagged"])
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = (data ?? []) as Property[];
  let flagged = 0;

  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i];
      const b = rows[j];
      if (a.city.toLowerCase() !== b.city.toLowerCase()) continue;
      if (a.area.toLowerCase() !== b.area.toLowerCase()) continue;

      const priceRatio =
        Math.min(Number(a.price), Number(b.price)) /
        Math.max(Number(a.price), Number(b.price) || 1);
      const titleSim = titleSimilarity(a.title, b.title);
      const sameAgent = a.agent_id === b.agent_id;

      let confidence = 0;
      if (titleSim >= 0.85 && priceRatio >= 0.95) confidence = 0.9;
      else if (titleSim >= 0.7 && priceRatio >= 0.85) confidence = 0.75;
      else if (sameAgent && titleSim >= 0.6 && priceRatio >= 0.9) confidence = 0.7;

      const sharedMedia =
        a.media_urls?.length &&
        b.media_urls?.length &&
        a.media_urls[0] === b.media_urls[0];
      if (sharedMedia) confidence = Math.max(confidence, 0.85);

      if (confidence < 0.65) continue;

      const groupId = (a as Property & { duplicate_group_id?: string }).duplicate_group_id
        ?? (b as Property & { duplicate_group_id?: string }).duplicate_group_id
        ?? randomUUID();

      await admin
        .from("properties")
        .update({
          possible_duplicate: true,
          duplicate_confidence_score: confidence,
          duplicate_group_id: groupId,
          updated_at: new Date().toISOString(),
        })
        .in("id", [a.id, b.id]);

      flagged += 2;
    }
  }

  return flagged;
}

export async function recalculateListingQuality(
  admin: SupabaseClient,
  limit = 200
): Promise<number> {
  const { data } = await admin
    .from("properties")
    .select("*")
    .in("status", ["approved", "pending", "flagged"])
    .order("updated_at", { ascending: false })
    .limit(limit);

  let updated = 0;
  for (const row of (data ?? []) as Property[]) {
    const freshness = computeListingFreshness(row);
    const health = computeListingHealth(row);
    const images = analyzeImageQuality(row);
    const enriched = {
      ...row,
      ...freshness,
      listing_health_score: health.listing_health_score,
      listing_quality_flags: health.listing_quality_flags,
      image_quality_score: images.image_quality_score,
      image_quality_flags: images.image_quality_flags,
    };
    const confidence_score = computeListingConfidence(enriched);
    await admin
      .from("properties")
      .update({
        ...freshness,
        listing_health_score: health.listing_health_score,
        listing_quality_flags: health.listing_quality_flags,
        image_quality_score: images.image_quality_score,
        image_quality_flags: images.image_quality_flags,
        confidence_score,
        yike_inspection_eligible:
          (health.listing_health_score ?? 0) >= 55 &&
          images.image_quality_score >= 50 &&
          row.status === "approved",
        updated_at: row.updated_at,
      })
      .eq("id", row.id);
    updated++;
  }
  return updated;
}

export async function recalculateAgentTrustMetrics(
  admin: SupabaseClient,
  limit = 100
): Promise<number> {
  const { data: agents } = await admin
    .from("profiles")
    .select("*")
    .in("role", ["agent", "agent_unverified", "agent_verified"])
    .limit(limit);

  let updated = 0;
  for (const agent of (agents ?? []) as Profile[]) {
    const metrics = await computeAgentTrust(admin, agent);
    await admin.from("agent_trust_metrics").upsert({
      profile_id: agent.id,
      ...metrics,
      updated_at: new Date().toISOString(),
    });

    await admin
      .from("profiles")
      .update({
        trust_score: Math.round(metrics.trust_score),
        performance_score: Math.round(metrics.performance_score),
        reputation_score: metrics.reputation_score,
        complaint_score: metrics.complaint_score,
        response_rate: metrics.response_rate,
        avg_response_time_minutes: metrics.avg_response_time_minutes,
        stale_listing_ratio: metrics.stale_listing_ratio,
        is_responsive:
          (metrics.response_rate ?? 0) >= 0.6 &&
          (metrics.avg_response_time_minutes ?? 999) <= 360,
      })
      .eq("id", agent.id);

    updated++;
  }
  return updated;
}

async function computeAgentTrust(
  admin: SupabaseClient,
  agent: Profile
): Promise<{
  response_rate: number;
  avg_response_time_minutes: number | null;
  verification_level: string | null;
  successful_inquiries: number;
  complaint_count: number;
  active_listing_count: number;
  rejected_listing_count: number;
  moderation_flags: number;
  stale_listing_ratio: number;
  trust_score: number;
  performance_score: number;
  reputation_score: number;
  complaint_score: number;
}> {
  const [{ count: activeListings }, { count: rejectedListings }, { count: flaggedListings }] =
    await Promise.all([
      admin
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", agent.id)
        .eq("status", "approved")
        .gt("expires_at", new Date().toISOString()),
      admin
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", agent.id)
        .eq("status", "rejected"),
      admin
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", agent.id)
        .eq("status", "flagged"),
    ]);

  const { data: staleRows } = await admin
    .from("properties")
    .select("listing_activity_status")
    .eq("agent_id", agent.id)
    .eq("status", "approved");

  const staleCount = (staleRows ?? []).filter(
    (r) =>
      r.listing_activity_status === "stale" ||
      r.listing_activity_status === "inactive"
  ).length;
  const totalActive = staleRows?.length ?? 0;
  const stale_listing_ratio =
    totalActive > 0 ? staleCount / totalActive : 0;

  const { data: leadStats } = await admin
    .from("leads")
    .select("inquiry_status, response_time_minutes")
    .eq("agent_id", agent.id)
    .gte("clicked_at", new Date(Date.now() - 90 * 86_400_000).toISOString());

  const leads = leadStats ?? [];
  const responded = leads.filter(
    (l) =>
      l.inquiry_status === "responded" || l.inquiry_status === "resolved"
  ).length;
  const response_rate = leads.length > 0 ? responded / leads.length : 0;

  const times = leads
    .map((l) => l.response_time_minutes)
    .filter((t): t is number => t != null && Number.isFinite(Number(t)))
    .map(Number);
  const avg_response_time_minutes =
    times.length > 0
      ? times.reduce((a, b) => a + b, 0) / times.length
      : null;

  const complaint_count = agent.complaint_count ?? 0;
  const successful_inquiries = agent.successful_handoffs ?? responded;

  let trust_score = 50;
  if (isVerifiedAgentProfile(agent)) trust_score += 20;
  trust_score += Math.min(15, (activeListings ?? 0) * 2);
  trust_score += response_rate * 20;
  trust_score -= stale_listing_ratio * 25;
  trust_score -= Math.min(20, complaint_count * 5);
  trust_score -= Math.min(15, (flaggedListings ?? 0) * 5);
  trust_score = Math.max(0, Math.min(100, trust_score));

  let performance_score = trust_score * 0.6;
  if (avg_response_time_minutes != null && avg_response_time_minutes <= 120) {
    performance_score += 15;
  }
  performance_score += response_rate * 25;
  performance_score = Math.max(0, Math.min(100, performance_score));

  const reputation_score = Math.round(performance_score * 100) / 100;
  const complaint_score = Math.min(
    100,
    Math.round(complaint_count * 12 + (flaggedListings ?? 0) * 8)
  );

  return {
    response_rate: Math.round(response_rate * 1000) / 1000,
    avg_response_time_minutes,
    verification_level: agent.verification_level ?? null,
    successful_inquiries,
    complaint_count,
    active_listing_count: activeListings ?? 0,
    rejected_listing_count: rejectedListings ?? 0,
    moderation_flags: flaggedListings ?? 0,
    stale_listing_ratio: Math.round(stale_listing_ratio * 1000) / 1000,
    trust_score: Math.round(trust_score * 100) / 100,
    performance_score: Math.round(performance_score * 100) / 100,
    reputation_score,
    complaint_score,
  };
}

export async function runTrustQualityBatch(admin: SupabaseClient): Promise<{
  listingsUpdated: number;
  duplicatesFlagged: number;
  agentsUpdated: number;
}> {
  const listingsUpdated = await recalculateListingQuality(admin);
  const duplicatesFlagged = await scanListingDuplicates(admin);
  const agentsUpdated = await recalculateAgentTrustMetrics(admin);
  return { listingsUpdated, duplicatesFlagged, agentsUpdated };
}
