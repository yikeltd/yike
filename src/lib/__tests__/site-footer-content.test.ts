import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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

test("footer link groups match product routes", () => {
  assert.deepEqual(
    FOOTER_EXPLORE_LINKS.map((l) => l.href),
    ["/buy", "/rent", "/vehicles", "/land", "/post-property"],
  );
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

test("footer copy reflects Yike Ltd ownership and accurate tagline", () => {
  assert.match(FOOTER_TAGLINE, /property, vehicles, and land/);
  assert.doesNotMatch(FOOTER_TAGLINE, /verified/i);
  assert.equal(FOOTER_OWNERSHIP_LINE, "Owned & Operated by Yike Ltd.");
  assert.match(FOOTER_SAFETY_DISCLAIMER, /property and vehicle marketplace/);
});

test("site footer component has no Stankings branding", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/layout/site-footer.tsx"),
    "utf8",
  );
  assert.doesNotMatch(src, /stankings/i);
  assert.doesNotMatch(src, /Stankings/i);
  assert.match(src, /FOOTER_OWNERSHIP_LINE|Owned & Operated by Yike Ltd/);
});
