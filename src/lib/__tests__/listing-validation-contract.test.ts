import assert from "node:assert/strict";
import test from "node:test";
import {
  allVerticalPhotoRulesAlignWithServer,
  listingCreateValidationContractSnapshot,
} from "@/lib/listing-create/validation-contract";
import { LISTING_CREATE_MIN_PHOTOS } from "@/lib/listing-create/constants";
import { parseVehicleBody } from "@/lib/listing-create/vehicle-body";
import { parseElectronicsBody } from "@/lib/listing-create/electronics-body";

const HTTPS_MEDIA = [
  "https://abc.supabase.co/storage/v1/object/public/property-media/a.jpg",
  "https://abc.supabase.co/storage/v1/object/public/property-media/b.jpg",
];

test("all vertical photo rules align with shared create contract", () => {
  assert.equal(allVerticalPhotoRulesAlignWithServer(), true);
  const snap = listingCreateValidationContractSnapshot();
  assert.equal(snap.minPhotos, LISTING_CREATE_MIN_PHOTOS);
  assert.equal(snap.propertyPhotoRules.min, LISTING_CREATE_MIN_PHOTOS);
});

test("vehicle parser rejects unknown condition values", () => {
  const base = {
    auto_category: "car",
    make: "Toyota",
    model: "Camry",
    year: 2020,
    state: "Lagos",
    city: "Ikeja",
    title: "Camry",
    price: 8_000_000,
    media_urls: HTTPS_MEDIA,
  };
  assert.ok(parseVehicleBody({ ...base, vehicle_condition: "used" }));
  assert.equal(parseVehicleBody({ ...base, vehicle_condition: "not_a_condition" }), null);
});

test("electronics parser rejects unknown condition values", () => {
  const base = {
    auto_category: "phones_tablets",
    brand: "Samsung",
    model: "A54",
    title: "Phone",
    price: 100_000,
    state: "Lagos",
    city: "Lagos",
    media_urls: HTTPS_MEDIA,
  };
  assert.ok(parseElectronicsBody({ ...base, condition: "brand_new" }));
  assert.equal(parseElectronicsBody({ ...base, condition: "fair" }), null);
});
