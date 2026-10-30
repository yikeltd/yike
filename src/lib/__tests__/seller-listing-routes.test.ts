import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "src/app/agent/listings");

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

test("canonical workspace /new requires agent lister and seller verification", () => {
  const src = readFileSync(
    join(process.cwd(), "src/app/agent/listings/new/page.tsx"),
    "utf8",
  );
  assert.match(src, /requireAgentLister/);
  assert.match(src, /mustCompleteSellerVerification/);
  assert.match(src, /InstantListingWorkspace/);
});

test("legacy choose and category shortcuts redirect to instant workspace", () => {
  assert.match(read("choose/page.tsx"), /redirect\(/);
  assert.match(read("choose/page.tsx"), /\/agent\/listings\/new/);
  assert.match(read("new/property/page.tsx"), /category=property/);
  assert.match(read("new/vehicle/page.tsx"), /category=vehicle/);
  assert.match(read("new/electronics/page.tsx"), /category=electronics/);
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

test("sell CTAs target canonical listing workspace path", () => {
  const header = readFileSync(
    join(process.cwd(), "src/components/layout/header-desktop.tsx"),
    "utf8",
  );
  assert.match(header, /\/agent\/listings\/new/);
  const redirects = readFileSync(
    join(process.cwd(), "src/lib/route-redirects.ts"),
    "utf8",
  );
  assert.match(redirects, /\/sell[\s\S]*\/agent\/listings\/new/);
});
