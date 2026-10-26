import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  formatListingPublicLocation,
} from "@/components/marketplace/listing-detail-location-section";

const root = join(process.cwd(), "src");

const DETAIL_FILES = [
  "components/property/property-detail-experience.tsx",
  "components/marketplace/vehicle-detail-experience.tsx",
  "components/marketplace/electronics-detail-experience.tsx",
] as const;

test("formatListingPublicLocation joins area, city, and state without fabrication", () => {
  assert.equal(
    formatListingPublicLocation({
      area: "Ariaria",
      city: "Aba",
      state: "Abia State",
    }),
    "Ariaria, Aba, Abia State",
  );
  assert.equal(formatListingPublicLocation({ city: "Lagos", state: "Lagos" }), "Lagos, Lagos");
  assert.equal(formatListingPublicLocation({}), "");
});

test("location section component has no map imagery", () => {
  const src = readFileSync(
    join(root, "components/marketplace/listing-detail-location-section.tsx"),
    "utf8",
  );
  assert.doesNotMatch(src, /next\/image|<Image|unsplash|iframe|google\.maps/i);
  assert.match(src, /listing-detail-location-section/);
  assert.doesNotMatch(src, /Exact address disclosed after contact/);
});

test("detail experiences use compact location section before seller card", () => {
  for (const file of DETAIL_FILES) {
    const src = readFileSync(join(root, file), "utf8");
    assert.match(src, /ListingDetailLocationSection/, file);
    assert.doesNotMatch(src, /ListingDetailLocationMap/, file);
    const locIdx = src.indexOf("ListingDetailLocationSection");
    const sellerIdx = src.indexOf("ListingDetailSellerSection");
    assert.ok(locIdx >= 0 && sellerIdx > locIdx, `${file}: seller follows location`);
    assert.match(src, /ListingDetailGalleryContact/, file);
  }
});

test("legacy map component file removed", () => {
  let threw = false;
  try {
    readFileSync(
      join(root, "components/marketplace/listing-detail-location-map.tsx"),
      "utf8",
    );
  } catch {
    threw = true;
  }
  assert.ok(threw);
});
