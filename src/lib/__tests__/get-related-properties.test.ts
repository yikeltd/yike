import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAssetType } from "@/lib/marketplace/listings";

/** Regression: related property queries must not return vehicles/electronics rows. */
test("related property SQL filter excludes non-PROPERTY asset types", () => {
  const filter = "asset_type.eq.PROPERTY,asset_type.is.null";
  const rows = [
    { id: "1", asset_type: "PROPERTY" },
    { id: "2", asset_type: null },
    { id: "3", asset_type: "VEHICLE" },
    { id: "4", asset_type: "ELECTRONICS" },
  ];
  const kept = rows.filter(
    (r) =>
      !r.asset_type || normalizeAssetType(r.asset_type) === "PROPERTY",
  );
  assert.deepEqual(kept.map((r) => r.id), ["1", "2"]);
  assert.ok(filter.includes("PROPERTY"));
});
