import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SELLER_CHOOSE_LISTING_PATH } from "@/lib/seller-trust";
import {
  FOOTER_TAGLINE,
  FOOTER_SAFETY_DISCLAIMER,
  FOOTER_OWNERSHIP_LINE,
  FOOTER_COMPANY_RC,
  FOOTER_EXPLORE_LINKS,
  FOOTER_COMPANY_LINKS,
  FOOTER_LEGAL_LINKS,
  footerCopyrightLine,
} from "@/lib/layout/site-footer-content";

test("footer explore links reflect three marketplace categories", () => {
  const hrefs = FOOTER_EXPLORE_LINKS.map((l) => l.href);
  assert.deepEqual(hrefs, [
    "/buy",
    "/rent",
    "/vehicles",
    "/electronics",
    SELLER_CHOOSE_LISTING_PATH,
  ]);
  assert.doesNotMatch(hrefs.join(" "), /\/land/);
  assert.match(hrefs.join(" "), /\/electronics/);
  assert.equal(
    FOOTER_EXPLORE_LINKS.find((l) => l.label === "Sell on Yike")?.href,
    SELLER_CHOOSE_LISTING_PATH,
  );
});

test("footer company and legal link groups match routes", () => {
  assert.deepEqual(
    FOOTER_COMPANY_LINKS.map((l) => l.href),
    ["/about", "/contact", "/safety", "/verify-agent"],
  );
  assert.deepEqual(
    FOOTER_LEGAL_LINKS.map((l) => l.href),
    ["/terms", "/privacy", "/cookies"],
  );
});

test("footer copyright uses current year and RC number", () => {
  const year = new Date().getFullYear();
  assert.equal(
    footerCopyrightLine(year),
    `© ${year} Yike Ltd. All rights reserved. ${FOOTER_COMPANY_RC}`,
  );
});

test("footer copy reflects three verticals and Yike Ltd ownership", () => {
  assert.equal(
    FOOTER_TAGLINE,
    "Nigeria's trusted marketplace for property, vehicles, and electronics.",
  );
  assert.doesNotMatch(FOOTER_TAGLINE, /land/i);
  assert.doesNotMatch(FOOTER_TAGLINE, /verified/i);
  assert.equal(FOOTER_OWNERSHIP_LINE, "Owned & Operated by Yike Ltd.");
  assert.match(FOOTER_SAFETY_DISCLAIMER, /property, vehicles, and electronics/);
  assert.doesNotMatch(FOOTER_SAFETY_DISCLAIMER, /land/i);
});

test("site footer component has no Stankings branding", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/layout/site-footer.tsx"),
    "utf8",
  );
  assert.doesNotMatch(src, /stankings/i);
  assert.match(src, /FOOTER_OWNERSHIP_LINE|Owned & Operated by Yike Ltd/);
  assert.match(src, /electronics_marketplace/);
});
