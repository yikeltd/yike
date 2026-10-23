import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveVehicleCategoryFilter,
  isMachineryCategory,
  isRoadMileageCategory,
  isYearOptionalCategory,
  vehicleCategoryLabel,
} from "@/lib/marketplace/vehicle-taxonomy";

test("resolveVehicleCategoryFilter supports group heavy", () => {
  const ids = resolveVehicleCategoryFilter({ group: "heavy" });
  assert.ok(ids && ids.length > 5);
  assert.ok(ids.includes("excavator"));
  assert.ok(ids.includes("heavy_equipment"));
});

test("resolveVehicleCategoryFilter supports legacy truck category", () => {
  const ids = resolveVehicleCategoryFilter({ category: "truck" });
  assert.deepEqual(ids, ["truck"]);
});

test("machinery vs road field profiles", () => {
  assert.equal(isMachineryCategory("excavator"), true);
  assert.equal(isMachineryCategory("car"), false);
  assert.equal(isRoadMileageCategory("car"), true);
  assert.equal(isRoadMileageCategory("excavator"), false);
  assert.equal(isYearOptionalCategory("tractor"), true);
  assert.equal(isYearOptionalCategory("car"), false);
});

test("vehicleCategoryLabel resolves new and legacy ids", () => {
  assert.equal(vehicleCategoryLabel("forklift_telehandler"), "Forklift & telehandler");
  assert.equal(vehicleCategoryLabel("truck"), "Truck (legacy)");
});
