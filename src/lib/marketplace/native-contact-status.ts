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

async function probeTable(table: string): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;
  const { error } = await admin.from(table).select("id").limit(1);
  if (!error) return true;
  const msg = (error.message ?? "").toLowerCase();
  if (msg.includes("does not exist") || msg.includes("schema cache")) return false;
  return false;
}

export async function getNativeContactStatus(): Promise<NativeContactStatus> {
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

  return {
    nativeContactEnabled,
    messagingFlagOn,
    messagingSchemaReady,
    messagingAvailable,
    yikeCoinsEnabled,
    reason,
  };
}
