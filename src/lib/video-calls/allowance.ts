import { createAdminClient } from "@/lib/supabase/admin";
import {
  FREE_CONNECTED_VIDEO_CALLS_PER_DAY,
  YIKE_COINS_TIMEZONE,
} from "@/lib/yike-coins/constants";
import { resolveActiveServicePrice } from "@/lib/yike-coins/pricing";
import { getYikeCoinBalance } from "@/lib/yike-coins/ledger";

export type VideoCallPreflight = {
  usageDate: string;
  freeAllowanceTotal: number;
  freeAllowanceUsed: number;
  freeAllowanceRemaining: number;
  billable: boolean;
  priceCoins: number | null;
  priceLabel: string | null;
  balanceCoins: number;
  resetExplanation: string;
};

export function lagosUsageDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: YIKE_COINS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export async function getVideoCallPreflight(userId: string): Promise<VideoCallPreflight> {
  const admin = createAdminClient();
  const usageDate = lagosUsageDate();
  let used = 0;

  if (admin) {
    const { data } = await admin
      .from("video_call_daily_usage")
      .select("free_connected_count")
      .eq("user_id", userId)
      .eq("usage_date", usageDate)
      .maybeSingle();
    used = Number(data?.free_connected_count ?? 0);
  }

  const remaining = Math.max(0, FREE_CONNECTED_VIDEO_CALLS_PER_DAY - used);
  const billable = remaining <= 0;

  let priceCoins: number | null = null;
  let priceLabel: string | null = null;
  if (billable && admin) {
    const price = await resolveActiveServicePrice(admin, "video_call_connected");
    if (price.ok) {
      priceCoins = price.priceCoins;
      priceLabel = price.label;
    }
  }

  const balanceCoins = await getYikeCoinBalance(userId);

  return {
    usageDate,
    freeAllowanceTotal: FREE_CONNECTED_VIDEO_CALLS_PER_DAY,
    freeAllowanceUsed: used,
    freeAllowanceRemaining: remaining,
    billable,
    priceCoins,
    priceLabel,
    balanceCoins,
    resetExplanation: `Free video calls reset at midnight (${YIKE_COINS_TIMEZONE}).`,
  };
}

/** Race-safe free allowance consumption tied to a connected session (server authoritative). */
export async function tryConsumeFreeVideoAllowance(
  userId: string,
  sessionId: string
): Promise<{
  consumed: boolean;
  countAfter: number;
}> {
  const admin = createAdminClient();
  if (!admin) return { consumed: false, countAfter: 0 };

  const usageDate = lagosUsageDate();
  const { data, error } = await admin.rpc("yike_video_try_consume_free_allowance", {
    p_user_id: userId,
    p_session_id: sessionId,
    p_usage_date: usageDate,
    p_free_limit: FREE_CONNECTED_VIDEO_CALLS_PER_DAY,
  });

  if (error) {
    return { consumed: false, countAfter: FREE_CONNECTED_VIDEO_CALLS_PER_DAY };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    consumed: Boolean(row?.consumed),
    countAfter: Number(row?.count_after ?? 0),
  };
}

/** Idempotent release when a session did not qualify as a billable connected call. */
export async function releaseFreeVideoAllowance(sessionId: string): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;

  const { data, error } = await admin.rpc("yike_video_release_free_allowance", {
    p_session_id: sessionId,
  });

  if (error) return false;
  const row = Array.isArray(data) ? data[0] : data;
  return Boolean(row?.released);
}
