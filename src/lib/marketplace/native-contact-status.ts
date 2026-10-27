import { createAdminClient } from "@/lib/supabase/admin";
import { isFeatureEnabled } from "@/lib/feature-flags/index";
import {
  isMarketplaceNativeContactEnabled,
  isYikeCoinsEnabled,
} from "@/lib/yike-coins/flags";

export type NativeContactStatus = {
  nativeContactEnabled: boolean;
  messagingFlagOn: boolean;
  messagingSchemaReady: boolean;
  messagingAvailable: boolean;
  yikeCoinsEnabled: boolean;
  reason: string | null;
};

const PROBE_TIMEOUT_MS = 3_000;
const STATUS_CACHE_TTL_MS = 30_000;

let statusCache: { at: number; value: NativeContactStatus } | null = null;

async function probeTable(table: string): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;
  const query = admin.from(table).select("id").limit(1);
  const raced = await Promise.race([
    query,
    new Promise<{ error: { message: string } }>((resolve) => {
      setTimeout(() => resolve({ error: { message: "probe timeout" } }), PROBE_TIMEOUT_MS);
    }),
  ]);
  const { error } = raced;
  if (!error) return true;
  const msg = (error.message ?? "").toLowerCase();
  if (msg.includes("does not exist") || msg.includes("schema cache")) return false;
  if (msg.includes("probe timeout")) return false;
  return false;
}

export async function getNativeContactStatus(): Promise<NativeContactStatus> {
  if (
    process.env.NODE_ENV !== "production" &&
    statusCache &&
    Date.now() - statusCache.at < STATUS_CACHE_TTL_MS
  ) {
    return statusCache.value;
  }
  const nativeContactEnabled = isMarketplaceNativeContactEnabled();
  const messagingFlagOn =
    nativeContactEnabled && isFeatureEnabled("conversation_platform_v1");
  const messagingSchemaReady = messagingFlagOn
    ? await probeTable("marketplace_conversations")
    : false;
  const messagingAvailable = messagingFlagOn && messagingSchemaReady;
  const yikeCoinsEnabled = isYikeCoinsEnabled();

  let reason: string | null = null;
  if (nativeContactEnabled && messagingFlagOn && !messagingSchemaReady) {
    reason =
      "In-app messaging is not ready on this environment yet. Use WhatsApp contact if available, or try again after staging migrations are applied.";
  } else if (nativeContactEnabled && !messagingFlagOn) {
    reason = "In-app messaging is turned off on this environment.";
  }

  const value: NativeContactStatus = {
    nativeContactEnabled,
    messagingFlagOn,
    messagingSchemaReady,
    messagingAvailable,
    yikeCoinsEnabled,
    reason,
  };
  if (process.env.NODE_ENV !== "production") {
    statusCache = { at: Date.now(), value };
  }
  return value;
}
