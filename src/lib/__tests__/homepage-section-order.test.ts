import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

function indexOfOrFail(haystack: string, needle: string, label: string): number {
  const i = haystack.indexOf(needle);
  assert.ok(i >= 0, `${label}: missing ${needle}`);
  return i;
}

test("mobile homepage order: hero then Latest on Yike then Featured", () => {
  const full = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/home/home-marketplace-experience.tsx"),
    "utf-8",
  );
  assert.ok(!full.includes("Explore categories"));
  assert.ok(!full.includes("HomeExploreCategories"));
  assert.ok(!full.includes("Swipe to discover"));

  const mobileStart = indexOfOrFail(full, "{/* MOBILE EXPERIENCE */}", "mobile");
  const src = full.slice(mobileStart);
  const hero = indexOfOrFail(src, "HomeCompactMarketplaceHero", "mobile");
  const latest = indexOfOrFail(src, 'title="Latest on Yike"', "mobile");
  const featured = indexOfOrFail(src, 'title="Featured"', "mobile");
  assert.ok(hero < latest, "Latest must follow hero");
  assert.ok(latest < featured, "Featured must follow Latest on Yike");
});

test("desktop homepage order: Latest on Yike then Featured without explore promo", () => {
  const full = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/home/home-desktop-view.tsx"),
    "utf-8",
  );
  assert.ok(!full.includes("Explore categories"));
  assert.ok(!full.includes("HomeExploreCategories"));

  const layoutStart = indexOfOrFail(full, 'className="mx-auto max-w-7xl space-y-6 px-8 pt-4"', "desktop");
  const src = full.slice(layoutStart);
  const latest = indexOfOrFail(src, '"Latest on Yike"', "desktop");
  const featured = indexOfOrFail(src, '"Featured"', "desktop");
  assert.ok(latest < featured, "Featured must follow Latest on Yike");
});
