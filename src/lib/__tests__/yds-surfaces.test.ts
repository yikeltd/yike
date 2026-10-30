import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { colors } from "@/lib/design/tokens";

test("globals.css defines YDS surface utilities and warm page background", () => {
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
  assert.match(css, /--background: var\(--ivory\)/);
  assert.match(css, /\.yike-panel/);
  assert.match(css, /\.yike-spec-cell/);
  assert.match(css, /\.yike-detail-canvas/);
  assert.match(css, /\.yike-section-heading/);
  assert.match(css, /\.yike-listing-card/);
  assert.match(css, /\.yike-browse-canvas/);
  assert.match(css, /\.yike-field-control/);
});

test("marketplace listing cards share YIKE_LISTING_CARD shell", () => {
  const cards = [
    "components/property/property-card.tsx",
    "components/marketplace/vehicle-card.tsx",
    "components/marketplace/electronics-card.tsx",
  ];
  for (const file of cards) {
    const src = readFileSync(join(process.cwd(), "src", file), "utf8");
    assert.match(src, /YIKE_LISTING_CARD|yike-listing-card/, file);
  }
});

test("design tokens align with locked brand navy and gold", () => {
  assert.equal(colors.navy.toLowerCase(), "#031b4e");
  assert.equal(colors.gold.toLowerCase(), "#e4b547");
  assert.equal(colors.canvas.toLowerCase(), colors.ivory.toLowerCase());
});

test("listing detail shared components use YDS panel primitives", () => {
  const files = [
    "components/marketplace/listing-detail-specifications-grid.tsx",
    "components/marketplace/listing-detail-location-section.tsx",
    "components/marketplace/listing-detail-gallery-contact.tsx",
  ];
  for (const file of files) {
    const src = readFileSync(join(process.cwd(), "src", file), "utf8");
    assert.match(src, /yike-panel|ListingDetailPanel/, file);
  }
  const specs = readFileSync(
    join(process.cwd(), "src/components/marketplace/listing-detail-specifications-grid.tsx"),
    "utf8",
  );
  assert.match(specs, /yike-spec-cell/);
  assert.match(specs, /min-\[480px\]:grid-cols-2/);
});
