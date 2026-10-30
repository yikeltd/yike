/**
 * Isolated E2E helpers for listing create APIs (non-production Supabase only).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ephemeralAuthEnabled } from "./ephemeral-auth";

const FIXTURE_PNG = join(process.cwd(), "public/icons/logo.png");

function adminClient(): SupabaseClient {
  if (!ephemeralAuthEnabled()) {
    throw new Error("Listing create fixture requires isolated ephemeral Supabase");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase admin env for listing fixture");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function seedListingTestMediaUrls(agentId: string): Promise<string[]> {
  const admin = adminClient();
  const buf = readFileSync(FIXTURE_PNG);
  const tag = randomBytes(6).toString("hex");
  const urls: string[] = [];
  for (let i = 0; i < 2; i++) {
    const path = `${agentId}/e2e/${tag}-${i}.png`;
    const { error } = await admin.storage.from("property-media").upload(path, buf, {
      contentType: "image/png",
      upsert: true,
    });
    if (error) throw new Error(`Media upload failed: ${error.message}`);
    const { data } = admin.storage.from("property-media").getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

export async function fetchListingRow(listingId: string) {
  const admin = adminClient();
  const { data, error } = await admin
    .from("properties")
    .select("id, agent_id, asset_type, status, slug, title, make, model, auto_category, listing_type, property_type")
    .eq("id", listingId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function countAgentListings(agentId: string): Promise<number> {
  const admin = adminClient();
  const { count, error } = await admin
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", agentId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function approveListingForPublicTest(listingId: string): Promise<void> {
  const admin = adminClient();
  const { error } = await admin
    .from("properties")
    .update({ status: "approved" })
    .eq("id", listingId);
  if (error) throw new Error(error.message);
}

export function uniqueIdempotencyKey(scope: string): string {
  return `e2e-${scope}-${randomBytes(8).toString("hex")}`;
}
