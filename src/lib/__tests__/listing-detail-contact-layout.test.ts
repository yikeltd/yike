import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "src");

const DETAIL_FILES = [
  "components/property/property-detail-experience.tsx",
  "components/marketplace/vehicle-detail-experience.tsx",
  "components/marketplace/electronics-detail-experience.tsx",
] as const;

test("seller contact card does not embed Message and Call actions", () => {
  const card = readFileSync(
    join(root, "components/marketplace/marketplace-seller-contact-card.tsx"),
    "utf8",
  );
  const section = readFileSync(
    join(root, "components/marketplace/listing-detail-seller-section.tsx"),
    "utf8",
  );
  assert.doesNotMatch(card, /SellerMessageCallActions/);
  assert.doesNotMatch(section, /SellerMessageCallActions/);
  assert.match(section, /variant="listingDetail"/);
  assert.match(card, /SellerContactReviewsPreview/);
  const reviews = readFileSync(
    join(root, "components/marketplace/seller-contact-reviews-preview.tsx"),
    "utf8",
  );
  assert.match(reviews, /Reviews &amp; feedback/);
});

test("property, vehicle, and electronics detail place gallery contact actions", () => {
  for (const file of DETAIL_FILES) {
    const src = readFileSync(join(root, file), "utf8");
    assert.match(src, /ListingDetailGalleryContact/, file);
  }
});

test("seller section follows compact location section on all detail surfaces", () => {
  for (const file of DETAIL_FILES) {
    const src = readFileSync(join(root, file), "utf8");
    assert.match(src, /ListingDetailLocationSection/, file);
    assert.match(src, /ListingDetailSellerSection/, file);
    const locIdx = src.indexOf("ListingDetailLocationSection");
    const sellerIdx = src.indexOf("ListingDetailSellerSection");
    assert.ok(locIdx >= 0 && sellerIdx > locIdx, `${file}: seller must follow location`);
  }
});

test("property detail removes sticky duplicate contact bar and sidebar seller card", () => {
  const src = readFileSync(
    join(root, "components/property/property-detail-experience.tsx"),
    "utf8",
  );
  assert.doesNotMatch(src, /STICKY MOBILE ACTIONS/);
  assert.doesNotMatch(src, /AgentContactCard/);
  assert.doesNotMatch(src, /lg:col-span-4/);
});

test("vehicle detail removes in-gallery seller card with duplicate actions", () => {
  const src = readFileSync(
    join(root, "components/marketplace/vehicle-detail-experience.tsx"),
    "utf8",
  );
  assert.doesNotMatch(src, /actionsVariant/);
  assert.doesNotMatch(src, /lg:col-span-4/);
});
