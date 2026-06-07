import type { SupabaseClient } from "@supabase/supabase-js";
import type { Property } from "@/types/database";
import { normalizeLocationParts } from "@/lib/location/canonical";
import { listingPurposeFromType } from "@/lib/pricing/purpose";
import { analyzeListingPrice, computePriceStats } from "@/lib/pricing/analyze";
import type { MarketPriceMemoryRow } from "@/lib/pricing/types";

type PriceBucket = {
  state: string;
  city: string;
  lga: string | null;
  area: string;
  neighborhood: string | null;
  property_type: string;
  listing_purpose: string;
  bedrooms: number | null;
  prices: number[];
};

function bucketKey(b: Omit<PriceBucket, "prices">): string {
  return [
    b.state,
    b.city,
    b.lga ?? "",
    b.area,
    b.neighborhood ?? "",
    b.property_type,
    b.listing_purpose,
    b.bedrooms ?? -1,
  ].join("|");
}

export async function recalculateMarketPriceMemory(
  admin: SupabaseClient,
  limit = 2000
): Promise<number> {
  const { data } = await admin
    .from("properties")
    .select(
      "state, city, area, property_type, listing_type, bedrooms, price, status, expires_at, possible_duplicate, price_review_status"
    )
    .eq("status", "approved")
    .gt("expires_at", new Date().toISOString())
    .not("price_review_status", "eq", "needs_confirmation")
    .order("updated_at", { ascending: false })
    .limit(limit);

  const buckets = new Map<string, PriceBucket>();

  for (const row of data ?? []) {
    if (row.possible_duplicate) continue;
    const price = Number(row.price);
    if (!price || price <= 0) continue;

    const loc = normalizeLocationParts({
      state: row.state,
      city: row.city,
      area: row.area,
    });
    const purpose = listingPurposeFromType(row.listing_type, row.property_type);
    const keyObj = {
      state: loc.state,
      city: loc.city,
      lga: loc.lga,
      area: loc.area,
      neighborhood: loc.neighborhood,
      property_type: String(row.property_type ?? "apartment").toLowerCase(),
      listing_purpose: purpose,
      bedrooms: row.bedrooms > 0 ? row.bedrooms : null,
    };
    const key = bucketKey(keyObj);
    const existing = buckets.get(key);
    if (existing) existing.prices.push(price);
    else buckets.set(key, { ...keyObj, prices: [price] });
  }

  let upserted = 0;
  for (const bucket of buckets.values()) {
    if (bucket.prices.length < 3) continue;
    const stats = computePriceStats(bucket.prices);
    const memory_key = bucketKey(bucket);
    const { error } = await admin.from("market_price_memory").upsert(
      {
        memory_key,
        state: bucket.state,
        city: bucket.city,
        lga: bucket.lga,
        area: bucket.area,
        neighborhood: bucket.neighborhood,
        property_type: bucket.property_type,
        listing_purpose: bucket.listing_purpose,
        bedrooms: bucket.bedrooms,
        sample_count: bucket.prices.length,
        ...stats,
        currency: "NGN",
        last_calculated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "memory_key", ignoreDuplicates: false }
    );
    if (!error) upserted++;
  }
  return upserted;
}

export async function lookupMarketMemory(
  admin: SupabaseClient,
  input: {
    state: string;
    city: string;
    lga?: string | null;
    area: string;
    neighborhood?: string | null;
    property_type: string;
    listing_type: string;
    bedrooms?: number;
  }
): Promise<{ memory: MarketPriceMemoryRow | null; luxuryMultiplier: number }> {
  const loc = normalizeLocationParts(input);
  const purpose = listingPurposeFromType(input.listing_type, input.property_type);
  const pt = input.property_type.toLowerCase();

  const queries = [
    { area: loc.canonicalArea, neighborhood: loc.neighborhood },
    { area: loc.area, neighborhood: loc.neighborhood },
    { area: loc.city, neighborhood: null as string | null },
  ];

  let memory: MarketPriceMemoryRow | null = null;
  for (const q of queries) {
    let builder = admin
      .from("market_price_memory")
      .select("*")
      .eq("state", loc.state)
      .eq("property_type", pt)
      .eq("listing_purpose", purpose)
      .order("sample_count", { ascending: false })
      .limit(1);

    if (q.area) builder = builder.ilike("area", q.area);
    if (input.bedrooms && input.bedrooms > 0) {
      builder = builder.or(`bedrooms.eq.${input.bedrooms},bedrooms.is.null`);
    }

    const { data } = await builder.maybeSingle();
    if (data && (data as MarketPriceMemoryRow).sample_count >= 3) {
      memory = data as MarketPriceMemoryRow;
      break;
    }
  }

  const { data: luxury } = await admin
    .from("market_luxury_zones")
    .select("tolerance_multiplier")
    .eq("state", loc.state)
    .eq("active", true)
    .or(
      `area.ilike.%${loc.area}%,neighborhood.ilike.%${loc.canonicalArea}%`
    )
    .limit(1)
    .maybeSingle();

  return {
    memory,
    luxuryMultiplier: Number(luxury?.tolerance_multiplier ?? 1),
  };
}

export async function analyzeAndPersistListingPrice(
  admin: SupabaseClient,
  property: Property,
  agentFlags?: {
    agentVerified?: boolean;
    companyVerified?: boolean;
    yikeVerified?: boolean;
  }
): Promise<void> {
  const { memory, luxuryMultiplier } = await lookupMarketMemory(admin, {
    state: property.state,
    city: property.city,
    area: property.area,
    property_type: property.property_type ?? "apartment",
    listing_type: property.listing_type,
    bedrooms: property.bedrooms,
  });

  const analysis = analyzeListingPrice(
    {
      state: property.state,
      city: property.city,
      area: property.area,
      property_type: property.property_type ?? "apartment",
      listing_type: property.listing_type,
      price: Number(property.price),
      bedrooms: property.bedrooms,
      ...agentFlags,
      yikeVerified: property.yike_verified ?? agentFlags?.yikeVerified,
    },
    memory,
    luxuryMultiplier
  );

  await admin
    .from("properties")
    .update({
      price_confidence_score: analysis.confidence_score,
      price_anomaly_level: analysis.anomaly_level,
      price_anomaly_reason: analysis.reason,
      market_price_snapshot: analysis.market_snapshot,
      price_review_status:
        property.price_review_status === "confirmed_by_agent"
          ? property.price_review_status
          : analysis.price_review_status,
      updated_at: property.updated_at,
    })
    .eq("id", property.id);
}
