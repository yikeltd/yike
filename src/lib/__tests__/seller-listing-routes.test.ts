import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "src/app/agent/listings");

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

test("gated seller create routes use requireAgentLister and seller verification", () => {
  for (const file of [
    "choose/page.tsx",
    "new/property/page.tsx",
    "new/vehicle/page.tsx",
    "new/electronics/page.tsx",
  ]) {
    const src = read(file);
    assert.match(src, /requireAgentLister/, `${file} must require agent lister`);
    assert.match(
      src,
      /mustCompleteSellerVerification/,
      `${file} must gate incomplete seller onboarding`,
    );
  }
});

test("canonical create flows use ListingEngine for all three verticals", () => {
  for (const file of [
    "new/property/page.tsx",
    "new/vehicle/page.tsx",
    "new/electronics/page.tsx",
  ]) {
    const src = read(file);
    assert.match(src, /ListingEngine/, `${file} must use ListingEngine`);
    assert.match(src, /categoryId="/, `${file} must set categoryId`);
  }
});

test("legacy ungated wizard paths redirect to gated new routes", () => {
  assert.match(read("property/page.tsx"), /redirect\("\/agent\/listings\/new\/property"\)/);
  assert.match(read("vehicle/page.tsx"), /redirect\("\/agent\/listings\/new\/vehicle"\)/);
});

test("requireAgentLister preserves returnPath for login next", () => {
  const auth = readFileSync(join(process.cwd(), "src/lib/auth.ts"), "utf8");
  assert.match(auth, /returnPath/);
  assert.match(auth, /safeNextPath/);
  assert.match(auth, /loginNext/);
});
