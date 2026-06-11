import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Advertisement } from "@/types/database";
import {
  durationDays,
  isAdvertisementPlacement,
  isDurationPlan,
  type AdvertisementDurationPlan,
  type AdvertisementPlacement,
  type AdvertisementStatus,
} from "@/lib/advertisements/constants";
import { advertisementVariantKey } from "@/lib/revenue-pricing/keys";
import { getRevenuePrice } from "@/lib/revenue-pricing/service";
import { logPaymentAudit } from "@/lib/payments/audit";

export type AdServiceResult =
  | { ok: true; advertisement: Advertisement }
  | { ok: false; error: string; code?: string };

function isLive(ad: Advertisement): boolean {
  if (ad.status !== "active") return false;
  const now = Date.now();
  if (ad.starts_at && new Date(ad.starts_at).getTime() > now) return false;
  if (ad.expires_at && new Date(ad.expires_at).getTime() <= now) return false;
  return Boolean(ad.image_url?.trim());
}

export async function getActiveAdvertisement(
  admin: SupabaseClient,
  placement: AdvertisementPlacement
): Promise<Advertisement | null> {
  const now = new Date().toISOString();
  const { data } = await admin
    .from("advertisements")
    .select("*")
    .eq("placement", placement)
    .eq("status", "active")
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const ad = data as Advertisement;
  return isLive(ad) ? ad : null;
}

export async function activateAdvertisementFromPayment(
  admin: SupabaseClient,
  input: {
    advertisementId: string;
    paymentOrderId: string;
    paymentReference: string;
  }
): Promise<AdServiceResult> {
  const { data: ad } = await admin
    .from("advertisements")
    .select("*")
    .eq("id", input.advertisementId)
    .single();

  if (!ad) {
    return { ok: false, error: "Advertisement not found", code: "not_found" };
  }

  const row = ad as Advertisement;
  if (row.status === "active") {
    return { ok: true, advertisement: row };
  }

  const placement = row.placement as AdvertisementPlacement;
  const plan = (row.duration_plan ?? "week") as AdvertisementDurationPlan;
  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + durationDays(plan));

  const { data: conflict } = await admin
    .from("advertisements")
    .select("id")
    .eq("placement", placement)
    .eq("status", "active")
    .neq("id", input.advertisementId)
    .maybeSingle();

  if (conflict?.id) {
    await admin
      .from("advertisements")
      .update({ status: "paused", updated_at: now.toISOString() })
      .eq("id", conflict.id as string);
  }

  const { data: updated, error } = await admin
    .from("advertisements")
    .update({
      status: "active",
      starts_at: now.toISOString(),
      expires_at: expires.toISOString(),
      payment_order_id: input.paymentOrderId,
      updated_at: now.toISOString(),
    })
    .eq("id", input.advertisementId)
    .select("*")
    .single();

  if (error || !updated) {
    return { ok: false, error: error?.message ?? "Could not activate ad" };
  }

  logPaymentAudit({
    action: "promotion_activated",
    actorId: row.created_by ?? input.advertisementId,
    targetId: input.paymentOrderId,
    metadata: {
      advertisement_id: input.advertisementId,
      placement,
      reference: input.paymentReference,
    },
  });

  return { ok: true, advertisement: updated as Advertisement };
}

export async function expireDueAdvertisements(admin: SupabaseClient): Promise<number> {
  const now = new Date().toISOString();
  const { data } = await admin
    .from("advertisements")
    .select("id")
    .eq("status", "active")
    .lt("expires_at", now);

  if (!data?.length) return 0;

  await admin
    .from("advertisements")
    .update({ status: "expired", updated_at: now })
    .in(
      "id",
      data.map((r) => r.id as string)
    );

  return data.length;
}

export async function recordAdImpression(
  admin: SupabaseClient,
  advertisementId: string,
  userId?: string | null
): Promise<void> {
  await admin.from("ad_impressions").insert({
    advertisement_id: advertisementId,
    user_id: userId ?? null,
  });
}

export async function recordAdClick(
  admin: SupabaseClient,
  advertisementId: string,
  userId?: string | null,
  ip?: string | null
): Promise<void> {
  const ip_hash = ip
    ? createHash("sha256").update(ip).digest("hex").slice(0, 32)
    : null;

  await admin.from("ad_clicks").insert({
    advertisement_id: advertisementId,
    user_id: userId ?? null,
    ip_hash,
  });
}

export function validateAdCreateInput(input: {
  title: string;
  advertiserName: string;
  destinationUrl: string;
  placement: string;
  durationPlan: string;
  imageUrl: string;
}): string | null {
  if (!input.title.trim()) return "Title is required.";
  if (!input.advertiserName.trim()) return "Advertiser name is required.";
  if (!input.imageUrl.trim()) return "Image is required.";
  if (!input.destinationUrl.trim()) return "Destination URL is required.";
  if (!isAdvertisementPlacement(input.placement)) return "Invalid placement.";
  if (!isDurationPlan(input.durationPlan)) return "Choose week or month duration.";
  try {
    const url = new URL(input.destinationUrl);
    if (!["http:", "https:"].includes(url.protocol)) return "URL must be http or https.";
  } catch {
    return "Enter a valid destination URL.";
  }
  return null;
}

export async function computeAdAmount(
  admin: SupabaseClient,
  placement: string,
  durationPlan: string
): Promise<number | null> {
  if (!isAdvertisementPlacement(placement) || !isDurationPlan(durationPlan)) return null;
  return getRevenuePrice(
    admin,
    "advertisement",
    advertisementVariantKey(placement, durationPlan)
  );
}

export async function getAdMetrics(
  admin: SupabaseClient,
  advertisementId: string
): Promise<{ impressions: number; clicks: number; ctr: number }> {
  const [{ count: impressions }, { count: clicks }] = await Promise.all([
    admin
      .from("ad_impressions")
      .select("id", { count: "exact", head: true })
      .eq("advertisement_id", advertisementId),
    admin
      .from("ad_clicks")
      .select("id", { count: "exact", head: true })
      .eq("advertisement_id", advertisementId),
  ]);

  const imp = impressions ?? 0;
  const clk = clicks ?? 0;
  const ctr = imp > 0 ? Math.round((clk / imp) * 1000) / 10 : 0;
  return { impressions: imp, clicks: clk, ctr };
}

export const AD_STATUS_TABS: AdvertisementStatus[] = [
  "draft",
  "pending",
  "active",
  "expired",
];

export type TopPerformingAd = {
  id: string;
  title: string;
  placement: AdvertisementPlacement;
  impressions: number;
  clicks: number;
  ctr: number;
};

export async function getAdvertisingDashboardMetrics(admin: SupabaseClient): Promise<{
  activeAds: number;
  adsExpiringSoon: number;
  topPerformingAds: TopPerformingAd[];
}> {
  const now = new Date();
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 7);

  const [{ count: activeAds }, { data: expiring }] = await Promise.all([
    admin
      .from("advertisements")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    admin
      .from("advertisements")
      .select("id")
      .eq("status", "active")
      .not("expires_at", "is", null)
      .lte("expires_at", soon.toISOString())
      .gt("expires_at", now.toISOString()),
  ]);

  const { data: candidates } = await admin
    .from("advertisements")
    .select("id, title, placement")
    .in("status", ["active", "expired", "paused"])
    .order("updated_at", { ascending: false })
    .limit(12);

  const topPerformingAds: TopPerformingAd[] = [];
  if (candidates?.length) {
    const withMetrics = await Promise.all(
      candidates.map(async (row) => ({
        id: row.id as string,
        title: row.title as string,
        placement: row.placement as AdvertisementPlacement,
        ...(await getAdMetrics(admin, row.id as string)),
      }))
    );
    topPerformingAds.push(
      ...withMetrics
        .filter((r) => r.impressions > 0 || r.clicks > 0)
        .sort((a, b) => b.clicks - a.clicks || b.ctr - a.ctr)
        .slice(0, 5)
    );
  }

  return {
    activeAds: activeAds ?? 0,
    adsExpiringSoon: expiring?.length ?? 0,
    topPerformingAds,
  };
}
