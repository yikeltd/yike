import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { queryPublicElectronics, queryPublicVehicles } from "@/lib/marketplace/listings";

function loadE2eEnv() {
  const path = join(process.cwd(), ".env.e2e.local");
  if (!existsSync(path)) return false;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return true;
}

const isolated =
  process.env.E2E_ISOLATED_SUPABASE === "1" ||
  process.env.RUN_MARKETPLACE_SEARCH_ISOLATED === "1";

test("isolated DB: property, vehicle, electronics search filters", async (t) => {
  if (!isolated) {
    t.skip("Set RUN_MARKETPLACE_SEARCH_ISOLATED=1 with .env.e2e.local");
    return;
  }
  loadE2eEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    t.skip("Missing Supabase URL or service role in .env.e2e.local");
    return;
  }

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { count } = await client
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");
  if ((count ?? 0) < 10) {
    t.skip(
      `Need seeded sample listings (run: set -a && source .env.e2e.local && npm run seed:sample-listings). count=${count ?? 0}`,
    );
    return;
  }

  async function queryProperties(filters: {
    city?: string;
    min_price?: number;
    max_price?: number;
    q?: string;
  }) {
    let q = client
      .from("properties")
      .select("id, title, city, price, asset_type, status")
      .eq("status", "approved")
      .gt("expires_at", new Date().toISOString())
      .or("asset_type.eq.PROPERTY,asset_type.is.null");
    if (filters.city) q = q.ilike("city", `%${filters.city}%`);
    if (filters.min_price != null) q = q.gte("price", filters.min_price);
    if (filters.max_price != null) q = q.lte("price", filters.max_price);
    if (filters.q) {
      q = q.or(
        `title.ilike.%${filters.q}%,city.ilike.%${filters.q}%,description.ilike.%${filters.q}%`,
      );
    }
    const { data, error } = await q.limit(48);
    if (error) throw error;
    return data ?? [];
  }

  const propertyLagos = await queryProperties({ city: "Lagos" });
  assert.ok(propertyLagos.length > 0);
  assert.ok(
    propertyLagos.every((p) =>
      (p.city ?? "").toLowerCase().includes("lagos"),
    ),
  );

  const propertyBudget = await queryProperties({
    min_price: 1_000_000,
    max_price: 10_000_000,
  });
  assert.ok(propertyBudget.length > 0);
  assert.ok(
    propertyBudget.every(
      (p) => p.price >= 1_000_000 && p.price <= 10_000_000,
    ),
  );

  const minPriceLink = await queryProperties({ min_price: 3_000_000 });
  assert.ok(minPriceLink.length > 0);
  assert.ok(minPriceLink.every((p) => p.price >= 3_000_000));

  const vehicles = await queryPublicVehicles(client, { q: "Toyota", limit: 48 });
  assert.ok(vehicles.length > 0);
  assert.ok(
    vehicles.some(
      (v) =>
        v.title.toLowerCase().includes("toyota") ||
        (v.make ?? "").toLowerCase().includes("toyota"),
    ),
  );

  const suv = await queryPublicVehicles(client, { auto_category: "suv", limit: 48 });
  assert.ok(suv.length > 0);
  assert.ok(suv.every((v) => v.auto_category === "suv"));

  const electronics = await queryPublicElectronics(client, {
    q: "Samsung",
    limit: 48,
  });
  assert.ok(electronics.length > 0);

  const phones = await queryPublicElectronics(client, {
    auto_category: "phones_tablets",
    city: "Lagos",
    min_price: 50_000,
    max_price: 5_000_000,
    limit: 48,
  });
  assert.ok(phones.length > 0);
  assert.ok(phones.every((e) => e.auto_category === "phones_tablets"));
});
