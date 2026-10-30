import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { detectMarketplaceCategory } from "@/lib/listing-engine/intelligence";

test("high-confidence vehicle hint maps to vehicle route in choose UI", () => {
  const hint = detectMarketplaceCategory("2017 Lexus RX350 foreign used Lagos");
  assert.equal(hint?.categoryId, "vehicle");
  const src = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/agent/seller-category-choose.tsx"),
    "utf-8",
  );
  assert.match(src, /detectMarketplaceCategory/);
  assert.match(src, /HINT_ROUTES/);
});
