import assert from "node:assert/strict";
import test from "node:test";
import {
  discoverLocationPillLabel,
  discoverStateScopeFromMarketplaceLocation,
} from "@/lib/discover/location-scope";

test("discoverStateScopeFromMarketplaceLocation prefers statewide scope", () => {
  assert.deepEqual(
    discoverStateScopeFromMarketplaceLocation({ state: "Enugu", city: "Enugu" }),
    { state: "Enugu", city: "" },
  );
  assert.deepEqual(
    discoverStateScopeFromMarketplaceLocation({ state: "Lagos", city: "" }),
    { state: "Lagos", city: "" },
  );
  assert.deepEqual(
    discoverStateScopeFromMarketplaceLocation(null),
    { state: "", city: "" },
  );
});

test("discoverLocationPillLabel reflects filters not card area", () => {
  assert.equal(
    discoverLocationPillLabel({ state: "Enugu", city: "" }),
    "Enugu statewide",
  );
  assert.equal(
    discoverLocationPillLabel({ state: "Lagos", city: "Ikeja" }),
    "Ikeja, Lagos",
  );
  assert.equal(discoverLocationPillLabel({ state: "", city: "" }), "All Nigeria");
});
