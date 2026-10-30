/**
 * Idempotent 90-listing seed (30 property · 30 vehicle · 30 electronics).
 *
 *   npm run seed:sample-listings -- --dry-run
 *   npx tsx --env-file=.env.local scripts/seed-sample-listings.ts
 *
 * Refuses production project unless ALLOW_PRODUCTION_SEED=1 (same as demo seed).
 * Purge: npm run seed:sample-listings -- --purge
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  SAMPLE_LISTINGS_NAMESPACE,
  SAMPLE_SELLERS,
  sampleListingCounts,
} from "../src/lib/sample-listings/catalog";
import { buildAllSampleDbRows } from "../src/lib/sample-listings/build-rows";
import { sampleCatalogIdToDbUuid } from "../src/lib/sample-listings/db-uuid";

const PRODUCTION_REF = "hlpojfurfldvcxfxhveg";
const DEMO_PASSWORD = "YikeSampleSeed2026!";

function projectRefFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    const m = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function resolveTarget() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const ref = projectRefFromUrl(url);
  return { url, key, ref };
}

function assertSafeTarget(ref: string | null, dryRun: boolean) {
  const allowProd = process.env.ALLOW_PRODUCTION_SEED === "1";
  console.log("\n=== Safety check ===");
  console.log(`Detected project ref: ${ref ?? "(none)"}`);
  console.log(`Production ref:       ${PRODUCTION_REF}`);
  console.log(`ALLOW_PRODUCTION_SEED:${allowProd ? "1" : "0"}`);

  if (!ref && !dryRun) {
    throw new Error("Could not parse Supabase project ref from SUPABASE_URL.");
  }
  if (!ref && dryRun) {
    console.warn("No SUPABASE_URL — dry-run catalog listing only.");
    return;
  }
  if (ref === PRODUCTION_REF && dryRun && !allowProd) {
    console.warn("Production URL detected — dry-run only, no writes.");
    return;
  }
  if (ref === PRODUCTION_REF && !allowProd) {
    throw new Error(
      "REFUSED: production Supabase. Point .env at sandbox/local or set ALLOW_PRODUCTION_SEED=1.",
    );
  }
}

async function ensureSeller(admin: SupabaseClient, seller: (typeof SAMPLE_SELLERS)[0]) {
  const userId = sampleCatalogIdToDbUuid(seller.id);
  const { data: existing } = await admin.auth.admin.getUserById(userId);
  if (!existing?.user) {
    const { error } = await admin.auth.admin.createUser({
      id: userId,
      email: seller.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: seller.full_name,
        phone: seller.phone,
        is_demo: true,
        seed_namespace: SAMPLE_LISTINGS_NAMESPACE,
      },
    });
    if (error && !/already|exists/i.test(error.message)) {
      throw new Error(`createUser ${seller.email}: ${error.message}`);
    }
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      full_name: seller.full_name,
      email: seller.email,
      phone: seller.phone,
      whatsapp: seller.phone,
      role: "agent_verified",
      account_type: "individual",
      agent_type: "independent",
      verification_status: "approved",
      verified_badge: true,
      is_verified_agent: true,
      trust_score: 90,
      phone_verified: true,
      email_verified: true,
      listing_limit: 100,
      listing_limit_reason: "seed:sample-listings",
      subscription_plan_code: "developer",
    },
    { onConflict: "id" },
  );
  if (profileError) {
    throw new Error(`profile upsert: ${profileError.message}`);
  }
}

async function upsertListings(admin: SupabaseClient) {
  const rows = buildAllSampleDbRows().map((row) => ({
    ...row,
    id: sampleCatalogIdToDbUuid(row.id),
    agent_id: sampleCatalogIdToDbUuid(row.agent_id),
    media_items: row.media_items?.map((item) => ({
      ...item,
      id: sampleCatalogIdToDbUuid(String(item.id)),
    })),
  }));
  const { error } = await admin.from("properties").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`properties upsert: ${error.message}`);
  return rows.length;
}

const LEGACY_SAMPLE_NAMESPACE = "yike-sample-listings-v1";

async function purge(admin: SupabaseClient) {
  const ids = buildAllSampleDbRows().map((r) => sampleCatalogIdToDbUuid(r.id));
  const { error: byIdError, count: byIdCount } = await admin
    .from("properties")
    .delete({ count: "exact" })
    .in("id", ids);
  if (byIdError) throw new Error(`purge by id: ${byIdError.message}`);

  for (const ns of [SAMPLE_LISTINGS_NAMESPACE, LEGACY_SAMPLE_NAMESPACE]) {
    const { error, count } = await admin
      .from("properties")
      .delete({ count: "exact" })
      .filter("attributes->>seed_namespace", "eq", ns);
    if (error) throw new Error(`purge namespace ${ns}: ${error.message}`);
    if ((count ?? 0) > 0) {
      console.log(`Purged ${count} listings with seed_namespace=${ns}.`);
    }
  }
  console.log(`Purged ${byIdCount ?? 0} sample listings by stable id.`);
}

async function main() {
  const dryRun = hasFlag("--dry-run");
  const purgeOnly = hasFlag("--purge");
  const counts = sampleListingCounts();

  console.log("Yike sample listings seed");
  console.log(`Namespace: ${SAMPLE_LISTINGS_NAMESPACE}`);
  console.log(
    `Catalog: ${counts.properties} properties, ${counts.vehicles} vehicles, ${counts.electronics} electronics (${counts.total} total)`,
  );

  const { url, key, ref } = resolveTarget();
  if (dryRun && !ref) {
    console.log("\nDry run — no Supabase URL configured. Sample slugs:");
    for (const row of buildAllSampleDbRows()) {
      console.log(`  ${row.asset_type} ${row.slug} (${row.id})`);
    }
    return;
  }

  assertSafeTarget(ref, dryRun);

  if (dryRun) {
    console.log("\nDry run — no writes. Sample slugs:");
    for (const row of buildAllSampleDbRows()) {
      console.log(`  ${row.asset_type} ${row.slug} (${row.id})`);
    }
    return;
  }

  if (!url || !key) {
    console.error(
      "Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Use sandbox/local credentials only.",
    );
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (purgeOnly) {
    await purge(admin);
    return;
  }

  for (const seller of SAMPLE_SELLERS) {
    await ensureSeller(admin, seller);
  }
  const n = await upsertListings(admin);
  console.log(`Upserted ${n} sample listings (idempotent).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
