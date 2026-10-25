import test from "node:test";
import assert from "node:assert/strict";
import {
  isVehicleFinanceEstimatorUiVisible,
  isVehicleMechanicInspectionUiVisible,
} from "@/lib/marketplace/vehicle-detail-surfaces";

test("vehicle mechanic inspection UI hidden by default", () => {
  assert.equal(isVehicleMechanicInspectionUiVisible(), false);
});

test("vehicle finance estimator UI hidden by default", () => {
  assert.equal(isVehicleFinanceEstimatorUiVisible(), false);
});
