import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { MetadataResolver, getListingCatalogsFromYip } from "@/lib/listing-engine";
import { ELECTRONICS_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/electronics";
import { valuesToElectronicsPayload } from "@/lib/listing-engine/adapters/electronics";
import { NAMED_VISIBILITY_RULES } from "@/lib/listing-engine/rules/registry";
import {
  ELECTRONICS_SELLER_CONDITIONS,
  ELECTRONICS_WARRANTY_STATUS,
} from "@/lib/marketplace/electronics-specs";

const CATALOGS = getListingCatalogsFromYip();

test("electronics manifest omits warranty months field", () => {
  const ids = ELECTRONICS_CATEGORY_MANIFEST.fields.map((f) => f.id);
  assert.ok(!ids.includes("warranty_months"));
  assert.ok(ids.includes("warranty_status"));
});

test("seller conditions are Nigeria-focused and API-safe", () => {
  const labels = ELECTRONICS_SELLER_CONDITIONS.map((c) => c.label);
  assert.ok(labels.includes("Brand new"));
  assert.ok(labels.includes("UK used"));
  assert.ok(labels.includes("Nigerian used"));
  assert.ok(!ELECTRONICS_SELLER_CONDITIONS.some((c) => String(c.id) === "for_parts"));
});

test("warranty status maps to attributes without months", () => {
  const payload = valuesToElectronicsPayload(
    {
      auto_category: "phones_tablets",
      brand: "Samsung",
      model: "A54",
      condition: "brand_new",
      warranty_status: "with_warranty",
      warranty_note: "Shop warranty till 2027",
      state: "Lagos",
      city: "Ikeja",
      title: "Samsung A54",
      price: 250_000,
    },
    { mediaUrls: ["https://x.supabase.co/a.webp", "https://x.supabase.co/b.webp"] },
  );
  const attrs = payload.attributes as Record<string, unknown>;
  assert.equal(attrs.warranty_status, "with_warranty");
  assert.equal(attrs.warranty_note, "Shop warranty till 2027");
  assert.equal(attrs.warranty_months, undefined);
});

test("phone specs hide fridge-only fields", () => {
  const values = {
    auto_category: "phones_tablets",
    brand: "Tecno",
    model: "Spark",
    condition: "nigerian_used",
  };
  const resolved = MetadataResolver.compute(
    ELECTRONICS_CATEGORY_MANIFEST,
    values,
    CATALOGS,
    { visibilityEvaluators: NAMED_VISIBILITY_RULES, photoCount: 0 },
  );
  const specIds = (resolved.stepFields.specs ?? []).map((f) => f.id);
  assert.ok(specIds.includes("storage_gb"));
  assert.ok(!specIds.includes("capacity_liters"));
  assert.ok(!specIds.includes("power_kva"));
});

test("fridge listing shows capacity not phone RAM", () => {
  const values = {
    auto_category: "refrigerators_freezers",
    brand: "Thermocool",
    model: "350L",
    condition: "brand_new",
  };
  const resolved = MetadataResolver.compute(
    ELECTRONICS_CATEGORY_MANIFEST,
    values,
    CATALOGS,
    { visibilityEvaluators: NAMED_VISIBILITY_RULES, photoCount: 0 },
  );
  const specIds = (resolved.stepFields.specs ?? []).map((f) => f.id);
  assert.ok(specIds.includes("capacity_liters"));
  assert.ok(!specIds.includes("storage_gb"));
});

test("warranty note only visible when warranty selected", () => {
  const withWarranty = MetadataResolver.compute(
    ELECTRONICS_CATEGORY_MANIFEST,
    { warranty_status: "with_warranty" },
    CATALOGS,
    { visibilityEvaluators: NAMED_VISIBILITY_RULES, photoCount: 0 },
  );
  assert.ok(
    (withWarranty.stepFields.specs ?? []).some((f) => f.id === "warranty_note"),
  );

  const noWarranty = MetadataResolver.compute(
    ELECTRONICS_CATEGORY_MANIFEST,
    { warranty_status: "no_warranty" },
    CATALOGS,
    { visibilityEvaluators: NAMED_VISIBILITY_RULES, photoCount: 0 },
  );
  assert.ok(
    !(noWarranty.stepFields.specs ?? []).some((f) => f.id === "warranty_note"),
  );
});

test("warranty status catalog is registered", () => {
  assert.equal(ELECTRONICS_WARRANTY_STATUS.length, 3);
  const src = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/listing-engine/catalogs/electronics.ts"),
    "utf-8",
  );
  assert.match(src, /electronics\.warranty_status/);
});
