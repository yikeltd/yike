import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = join(process.cwd(), "src/app/api/agent");

function readRoute(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

test("property create route uses idempotent insert with payload fingerprint", () => {
  const src = readRoute("listings/create/route.ts");
  assert.match(src, /fingerprintListingCreatePayload\("property"/);
  assert.match(src, /insertPropertyRowWithReservedId/);
  assert.match(src, /withListingCreateIdempotencyExtras/);
  assert.match(src, /eq\("agent_id", user\.id\)/);
  assert.match(src, /idempotency_payload_mismatch|code: idempotentInsert\.code/);
});

test("vehicle create route gates edits by agent_id and uses idempotent create", () => {
  const src = readRoute("vehicles/create/route.ts");
  assert.match(src, /existing\.agent_id !== user\.id/);
  assert.match(src, /fingerprintListingCreatePayload\("vehicle"/);
  assert.match(src, /insertPropertyRowWithReservedId/);
  assert.match(src, /normalizeIdempotencyKey/);
  assert.match(src, /parseVehicleBody/);
});

test("electronics create route gates edits by agent_id and uses idempotent create", () => {
  const src = readRoute("electronics/create/route.ts");
  assert.match(src, /existing\.agent_id !== user\.id/);
  assert.match(src, /fingerprintListingCreatePayload\("electronics"/);
  assert.match(src, /insertPropertyRowWithReservedId/);
  assert.match(src, /parseElectronicsBody/);
});

test("vehicle and electronics parsers require safe supabase media urls", () => {
  const vehicle = readFileSync(
    join(process.cwd(), "src/lib/listing-create/vehicle-body.ts"),
    "utf8",
  );
  const electronics = readFileSync(
    join(process.cwd(), "src/lib/listing-create/electronics-body.ts"),
    "utf8",
  );
  assert.match(vehicle, /isSafeListingMediaUrl/);
  assert.match(electronics, /isSafeListingMediaUrl/);
});

test("property create rejects blob and data urls in httpMediaUrls helper", () => {
  const src = readRoute("listings/create/route.ts");
  assert.match(src, /function httpMediaUrls/);
  assert.match(src, /blob:/);
  assert.match(src, /data:/);
});
