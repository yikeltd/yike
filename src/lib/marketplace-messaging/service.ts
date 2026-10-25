import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { isFeatureEnabled } from "@/lib/feature-flags/index";
import { isMarketplaceNativeContactEnabled } from "@/lib/yike-coins/flags";
import { normalizeAssetType } from "@/lib/marketplace/listings";

export type MarketplaceAssetType = "PROPERTY" | "VEHICLE" | "ELECTRONICS";

export type MarketplaceConversationRow = {
  id: string;
  listing_id: string;
  asset_type: MarketplaceAssetType;
  buyer_id: string;
  seller_id: string;
  last_message_at: string | null;
  created_at: string;
};

export type MarketplaceMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  client_message_id?: string | null;
};

export function isMarketplaceMessagingEnabled(): boolean {
  return (
    isMarketplaceNativeContactEnabled() &&
    isFeatureEnabled("conversation_platform_v1")
  );
}

export async function resolveListingSeller(
  admin: SupabaseClient,
  listingId: string,
  assetType: MarketplaceAssetType
): Promise<{ sellerId: string } | null> {
  const { data } = await admin
    .from("properties")
    .select("agent_id, asset_type")
    .eq("id", listingId)
    .maybeSingle();

  if (!data?.agent_id) return null;

  const rowAsset = normalizeAssetType(data.asset_type as string) as MarketplaceAssetType;
  if (rowAsset !== assetType) {
    return null;
  }

  return { sellerId: data.agent_id as string };
}

async function assertMessagingSchemaReady(
  admin: NonNullable<ReturnType<typeof createAdminClient>>
): Promise<{ ok: true } | { ok: false; error: string; code: string }> {
  const { error } = await admin.from("marketplace_conversations").select("id").limit(1);
  if (!error) return { ok: true };
  const msg = (error.message ?? "").toLowerCase();
  if (msg.includes("does not exist") || msg.includes("schema cache")) {
    return {
      ok: false,
      error: "In-app messaging is not ready on this environment yet.",
      code: "schema_unavailable",
    };
  }
  return { ok: false, error: error.message ?? "Database unavailable", code: "unavailable" };
}

export async function getOrCreateMarketplaceConversation(input: {
  listingId: string;
  assetType: MarketplaceAssetType;
  buyerId: string;
}): Promise<
  | { ok: true; conversation: MarketplaceConversationRow; created: boolean }
  | { ok: false; error: string; code: string }
> {
  if (!isMarketplaceMessagingEnabled()) {
    return { ok: false, error: "Messaging is not available", code: "disabled" };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, error: "Database unavailable", code: "unavailable" };
  }

  const schema = await assertMessagingSchemaReady(admin);
  if (!schema.ok) return schema;

  const seller = await resolveListingSeller(admin, input.listingId, input.assetType);
  if (!seller) {
    return { ok: false, error: "Listing not found", code: "not_found" };
  }
  if (seller.sellerId === input.buyerId) {
    return { ok: false, error: "You cannot message your own listing", code: "self" };
  }

  const { data: existing } = await admin
    .from("marketplace_conversations")
    .select("*")
    .eq("listing_id", input.listingId)
    .eq("buyer_id", input.buyerId)
    .maybeSingle();

  if (existing) {
    return {
      ok: true,
      conversation: existing as MarketplaceConversationRow,
      created: false,
    };
  }

  const { data: created, error } = await admin
    .from("marketplace_conversations")
    .insert({
      listing_id: input.listingId,
      asset_type: input.assetType,
      buyer_id: input.buyerId,
      seller_id: seller.sellerId,
    })
    .select("*")
    .single();

  if (error || !created) {
    const duplicate =
      error?.code === "23505" ||
      (error?.message ?? "").toLowerCase().includes("duplicate");
    if (duplicate) {
      const { data: raced } = await admin
        .from("marketplace_conversations")
        .select("*")
        .eq("listing_id", input.listingId)
        .eq("buyer_id", input.buyerId)
        .maybeSingle();
      if (raced) {
        return {
          ok: true,
          conversation: raced as MarketplaceConversationRow,
          created: false,
        };
      }
    }
    return { ok: false, error: error?.message ?? "Could not start conversation", code: "create_failed" };
  }

  return {
    ok: true,
    conversation: created as MarketplaceConversationRow,
    created: true,
  };
}

export async function getMarketplaceConversationForUser(
  conversationId: string,
  userId: string,
): Promise<
  | { ok: true; conversation: MarketplaceConversationRow }
  | { ok: false; error: string; code: string }
> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Database unavailable", code: "unavailable" };

  const schema = await assertMessagingSchemaReady(admin);
  if (!schema.ok) return schema;

  const { data: conv } = await admin
    .from("marketplace_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conv) return { ok: false, error: "Conversation not found", code: "not_found" };
  if (conv.buyer_id !== userId && conv.seller_id !== userId) {
    return { ok: false, error: "Forbidden", code: "forbidden" };
  }

  return { ok: true, conversation: conv as MarketplaceConversationRow };
}

export async function listConversationsForUser(
  userId: string,
  role: "buyer" | "seller" | "all" = "all"
): Promise<MarketplaceConversationRow[]> {
  const admin = createAdminClient();
  if (!admin) return [];
  const schema = await assertMessagingSchemaReady(admin);
  if (!schema.ok) return [];

  let query = admin.from("marketplace_conversations").select("*");
  if (role === "buyer") query = query.eq("buyer_id", userId);
  else if (role === "seller") query = query.eq("seller_id", userId);
  else query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

  const { data } = await query.order("last_message_at", { ascending: false, nullsFirst: false });
  return (data ?? []) as MarketplaceConversationRow[];
}

export async function listMessages(
  conversationId: string,
  userId: string
): Promise<
  | { ok: true; messages: MarketplaceMessageRow[] }
  | { ok: false; error: string; code: string }
> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Database unavailable", code: "unavailable" };

  const { data: conv } = await admin
    .from("marketplace_conversations")
    .select("id, buyer_id, seller_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conv) return { ok: false, error: "Conversation not found", code: "not_found" };
  if (conv.buyer_id !== userId && conv.seller_id !== userId) {
    return { ok: false, error: "Forbidden", code: "forbidden" };
  }

  const { data: messages } = await admin
    .from("marketplace_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return { ok: true, messages: (messages ?? []) as MarketplaceMessageRow[] };
}

export async function sendMessage(input: {
  conversationId: string;
  senderId: string;
  body: string;
  clientMessageId?: string | null;
}): Promise<
  | { ok: true; message: MarketplaceMessageRow }
  | { ok: false; error: string; code: string }
> {
  const body = input.body.trim();
  if (!body || body.length > 4000) {
    return { ok: false, error: "Message is required", code: "invalid_body" };
  }

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Database unavailable", code: "unavailable" };

  const { data: conv } = await admin
    .from("marketplace_conversations")
    .select("id, buyer_id, seller_id")
    .eq("id", input.conversationId)
    .maybeSingle();

  if (!conv) return { ok: false, error: "Conversation not found", code: "not_found" };
  if (conv.buyer_id !== input.senderId && conv.seller_id !== input.senderId) {
    return { ok: false, error: "Forbidden", code: "forbidden" };
  }

  const clientMessageId = input.clientMessageId?.trim() || null;
  if (clientMessageId) {
    const { data: existing } = await admin
      .from("marketplace_messages")
      .select("*")
      .eq("conversation_id", input.conversationId)
      .eq("client_message_id", clientMessageId)
      .maybeSingle();
    if (existing) {
      return { ok: true, message: existing as MarketplaceMessageRow };
    }
  }

  const now = new Date().toISOString();
  const insertRow: Record<string, unknown> = {
    conversation_id: input.conversationId,
    sender_id: input.senderId,
    body,
  };
  if (clientMessageId) insertRow.client_message_id = clientMessageId;

  const { data: message, error } = await admin
    .from("marketplace_messages")
    .insert(insertRow)
    .select("*")
    .single();

  if (error || !message) {
    if (clientMessageId && error?.code === "23505") {
      const { data: raced } = await admin
        .from("marketplace_messages")
        .select("*")
        .eq("conversation_id", input.conversationId)
        .eq("client_message_id", clientMessageId)
        .maybeSingle();
      if (raced) {
        return { ok: true, message: raced as MarketplaceMessageRow };
      }
    }
    return { ok: false, error: error?.message ?? "Send failed", code: "send_failed" };
  }

  await admin
    .from("marketplace_conversations")
    .update({ last_message_at: now })
    .eq("id", input.conversationId);

  return { ok: true, message: message as MarketplaceMessageRow };
}
