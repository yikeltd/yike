import test from "node:test";
import assert from "node:assert/strict";

test("sampleBrowseFallback returns live rows when present", async () => {
  process.env.YIKE_SAMPLE_LISTINGS_FIXTURE = "1";
  const { sampleBrowseFallback } = await import(
    "@/lib/sample-listings/query-fixtures"
  );
  const live = [{ id: "live-1" }] as never;
  assert.deepEqual(sampleBrowseFallback(live, "VEHICLE", {}), live);
  delete process.env.YIKE_SAMPLE_LISTINGS_FIXTURE;
});

test("sampleBrowseFallback filters Lagos vehicles when live empty", async () => {
  process.env.YIKE_SAMPLE_LISTINGS_FIXTURE = "1";
  const { sampleBrowseFallback } = await import(
    "@/lib/sample-listings/query-fixtures"
  );
  const rows = sampleBrowseFallback([], "VEHICLE", { city: "Lagos" });
  assert.ok(rows.length > 0);
  assert.ok(rows.every((r) => (r.city ?? "").toLowerCase().includes("lagos")));
  delete process.env.YIKE_SAMPLE_LISTINGS_FIXTURE;
});
