import test from "node:test";
import assert from "node:assert/strict";
import {
  isElectronicsBrowseSubmitted,
  isVehicleBrowseSubmitted,
} from "@/lib/marketplace/browse-submitted";
import {
  isPublicSampleFixtureBannerVisible,
  SampleFixtureBanner,
} from "@/components/sample-listings/sample-fixture-banner";

test("detects vehicle filters in URL", () => {
  assert.equal(isVehicleBrowseSubmitted({}), false);
  assert.equal(isVehicleBrowseSubmitted({ category: "suv" }), true);
  assert.equal(isVehicleBrowseSubmitted({ q: "toyota" }), true);
  assert.equal(isVehicleBrowseSubmitted({ sort: "price_asc" }), true);
  assert.equal(isVehicleBrowseSubmitted({ sort: "newest" }), false);
});

test("detects electronics filters in URL", () => {
  assert.equal(isElectronicsBrowseSubmitted({}), false);
  assert.equal(isElectronicsBrowseSubmitted({ category: "phones" }), true);
  assert.equal(isElectronicsBrowseSubmitted({ q: "iphone" }), true);
});

test("SampleFixtureBanner never renders on consumer UI", () => {
  assert.equal(isPublicSampleFixtureBannerVisible(), false);
  assert.equal(SampleFixtureBanner({ active: true }), null);
});

test("submitted browse helpers treat active filters as submitted", () => {
  assert.equal(isVehicleBrowseSubmitted({ category: "suv" }), true);
  assert.equal(isElectronicsBrowseSubmitted({ q: "phone" }), true);
});
