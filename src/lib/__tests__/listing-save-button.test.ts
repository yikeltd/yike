import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  LISTING_SAVE_CARD_OVERLAY_CLASS,
  listingSaveAriaLabel,
} from "@/lib/listings/toggle-listing-save";

const root = process.cwd();

const CARD_SOURCES = [
  "src/components/property/property-card.tsx",
  "src/components/marketplace/vehicle-card.tsx",
  "src/components/marketplace/electronics-card.tsx",
  "src/components/home/home-desktop-view.tsx",
];

test("listingSaveAriaLabel uses accessible save/remove copy", () => {
  assert.equal(listingSaveAriaLabel(false), "Save listing");
  assert.equal(listingSaveAriaLabel(true), "Remove saved listing");
});

test("card overlay contract includes 44px touch target and focus ring", () => {
  assert.match(LISTING_SAVE_CARD_OVERLAY_CLASS, /\bh-11\b/);
  assert.match(LISTING_SAVE_CARD_OVERLAY_CLASS, /\bw-11\b/);
  assert.match(LISTING_SAVE_CARD_OVERLAY_CLASS, /focus-visible:outline-gold/);
  assert.match(LISTING_SAVE_CARD_OVERLAY_CLASS, /motion-reduce/);
});

test("listing cards use shared ListingSaveButton with card-overlay variant", () => {
  for (const rel of CARD_SOURCES) {
    const src = readFileSync(join(root, rel), "utf8");
    assert.match(
      src,
      /ListingSaveButton[\s\S]*variant="card-overlay"/,
      `${rel} must use ListingSaveButton card-overlay`,
    );
  }
});

test("listing cards do not render ad hoc text Save buttons on imagery", () => {
  for (const rel of CARD_SOURCES) {
    const src = readFileSync(join(root, rel), "utf8");
    assert.doesNotMatch(
      src,
      />\s*Save\s*</,
      `${rel} must not include literal Save text in card markup`,
    );
    assert.doesNotMatch(
      src,
      /fill-red-500/,
      `${rel} must not use non-brand red heart fill`,
    );
  }
});

test("ListingSaveButton exposes aria-pressed and test id", () => {
  const src = readFileSync(
    join(root, "src/components/marketplace/listing-save-button.tsx"),
    "utf8",
  );
  assert.match(src, /aria-pressed=\{saved\}/);
  assert.match(src, /aria-busy=\{busy\}/);
  assert.match(src, /data-testid="listing-save-button"/);
  assert.match(src, /stopPropagation/);
  assert.match(src, /busy \|\| disabled \|\| mutationInFlightRef/);
  assert.match(src, /mutationInFlightRef/);
  assert.match(src, /guardAction/);
  assert.match(src, /showTransientError/);
});

test("detail and gallery surfaces use ListingSaveButton", () => {
  for (const rel of [
    "src/components/property/property-gallery.tsx",
    "src/components/marketplace/vehicle-detail-experience.tsx",
    "src/components/marketplace/electronics-detail-experience.tsx",
  ]) {
    const src = readFileSync(join(root, rel), "utf8");
    assert.match(src, /ListingSaveButton/, `${rel} should use shared save control`);
  }
});

test("toggle-listing-save module wires guest favorites helper", () => {
  const lib = readFileSync(
    join(root, "src/lib/listings/toggle-listing-save.ts"),
    "utf8",
  );
  assert.match(lib, /toggleGuestFavorite/);
  assert.match(lib, /toggleAuthenticatedListingSave/);
});
