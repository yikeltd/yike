/**
 * Marketplace messaging E2E — requires messaging schema + flags on the linked Supabase project.
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { ephemeralAuthEnabled } from "./ephemeral-auth";
import { ephemeralEmail } from "./authenticated-consumer";

const PRODUCTION_REF = "hlpojfurfldvcxfxhveg";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Missing Supabase admin env for messaging fixture");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function projectRefFromUrl(url: string | undefined) {
  const m = String(url ?? "").match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return m?.[1]?.toLowerCase() ?? null;
}

export type MessagingFixtureStatus = {
  ready: boolean;
  reason: string;
};

export async function messagingFixtureStatus(): Promise<MessagingFixtureStatus> {
  if (!ephemeralAuthEnabled()) {
    return {
      ready: false,
      reason: "Messaging seed requires E2E_EPHEMERAL_AUTH=1 on non-production Supabase",
    };
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const ref = projectRefFromUrl(url);
  if (ref === PRODUCTION_REF) {
    return { ready: false, reason: "Refusing messaging seed on production Supabase ref" };
  }

  try {
    const admin = adminClient();
    const { error } = await admin.from("marketplace_conversations").select("id").limit(1);
    if (error) {
      return {
        ready: false,
        reason: `marketplace_conversations unavailable: ${error.message}`,
      };
    }
  } catch (err) {
    return {
      ready: false,
      reason: err instanceof Error ? err.message : "Schema probe failed",
    };
  }

  return { ready: true, reason: "Schema reachable via service role" };
}

async function ensureProfile(userId: string, email: string) {
  const admin = adminClient();
  const { error } = await admin.from("profiles").upsert(
    {
      id: userId,
      full_name: "E2E Messaging",
      role: "user",
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(`Profile upsert failed: ${error.message}`);
  void email;
}

async function createEphemeralUser(tag: string) {
  const admin = adminClient();
  const email = ephemeralEmail(tag);
  const password = randomUUID().replace(/-/g, "").slice(0, 24);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user?.id) {
    throw new Error(`User create failed: ${error?.message ?? "no user"}`);
  }
  await ensureProfile(data.user.id, email);
  return { userId: data.user.id, email, password };
}

export type SeededConversation = {
  conversationId: string;
  buyer: { userId: string; email: string; password: string };
  sellerId: string;
};

export async function seedMarketplaceConversation(): Promise<SeededConversation | null> {
  const status = await messagingFixtureStatus();
  if (!status.ready) return null;

  const buyer = await createEphemeralUser("buyer");
  const seller = await createEphemeralUser("seller");
  const listingId = randomUUID();
  const admin = adminClient();

  const { data, error } = await admin
    .from("marketplace_conversations")
    .insert({
      listing_id: listingId,
      asset_type: "PROPERTY",
      buyer_id: buyer.userId,
      seller_id: seller.userId,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(`Conversation seed failed: ${error?.message ?? "no row"}`);
  }

  return {
    conversationId: data.id as string,
    buyer,
    sellerId: seller.userId,
  };
}

export async function deleteMessagingUsers(userIds: string[]) {
  if (!ephemeralAuthEnabled()) return;
  const admin = adminClient();
  for (const id of userIds) {
    if (id) await admin.auth.admin.deleteUser(id);
  }
}

/** After login, true when /conversations renders inbox chrome (not redirect to /). */
export async function isMessagingEnabledInBrowser(page: import("@playwright/test").Page): Promise<boolean> {
  await page.goto("/conversations", { waitUntil: "domcontentloaded", timeout: 60_000 });
  const path = new URL(page.url()).pathname;
  if (path === "/auth/login") return false;
  if (path === "/") return false;
  return path === "/conversations" || path.startsWith("/conversations/");
}
