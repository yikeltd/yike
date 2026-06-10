import type { SupabaseClient } from "@supabase/supabase-js";

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

export type DuplicateCheckInput = {
  agentId: string;
  title: string;
  price: number;
  city: string;
  area: string;
  description?: string | null;
  mediaUrls: string[];
  phone?: string | null;
};

export type DuplicateCheckResult = {
  likelyDuplicate: boolean;
  confidence: number;
  matchedPropertyId?: string;
};

/** Fast per-submit duplicate scan — flags internally, does not block genuine users. */
export async function checkLikelyDuplicate(
  admin: SupabaseClient,
  input: DuplicateCheckInput,
  excludePropertyId?: string
): Promise<DuplicateCheckResult> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await admin
    .from("properties")
    .select("id, title, price, city, area, description, media_urls, status")
    .eq("agent_id", input.agentId)
    .gte("created_at", since)
    .in("status", ["approved", "pending", "flagged"]);

  const rows = (data ?? []).filter((r) => r.id !== excludePropertyId);
  const cityKey = input.city.toLowerCase();
  const areaKey = input.area.toLowerCase();
  const descNorm = (input.description ?? "").toLowerCase().replace(/\s+/g, " ").trim();

  let best: DuplicateCheckResult = { likelyDuplicate: false, confidence: 0 };

  for (const row of rows) {
    if (row.city?.toLowerCase() !== cityKey) continue;
    if (row.area?.toLowerCase() !== areaKey) continue;

    const priceRatio =
      Math.min(Number(row.price), input.price) /
      Math.max(Number(row.price), input.price || 1);
    const titleSim = titleSimilarity(row.title, input.title);

    let confidence = 0;
    if (titleSim >= 0.85 && priceRatio >= 0.95) confidence = 0.9;
    else if (titleSim >= 0.7 && priceRatio >= 0.85) confidence = 0.75;
    else if (titleSim >= 0.6 && priceRatio >= 0.9) confidence = 0.65;

    const rowDesc = (row.description ?? "").toLowerCase().replace(/\s+/g, " ").trim();
    if (descNorm && rowDesc && descNorm === rowDesc && titleSim >= 0.5) {
      confidence = Math.max(confidence, 0.8);
    }

    const sharedMedia =
      row.media_urls?.length &&
      input.mediaUrls.length &&
      row.media_urls[0] === input.mediaUrls[0];
    if (sharedMedia) confidence = Math.max(confidence, 0.85);

    if (confidence > best.confidence) {
      best = {
        likelyDuplicate: confidence >= 0.65,
        confidence,
        matchedPropertyId: row.id,
      };
    }
  }

  return best;
}
