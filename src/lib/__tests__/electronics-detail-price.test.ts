import test from "node:test";
import assert from "node:assert/strict";
import { formatPrice } from "@/lib/utils";

test("electronics sale listings show total price without rent suffix", () => {
  const label = formatPrice(680_000, "total", "sale");
  assert.match(label, /680/);
  assert.doesNotMatch(label, /\/yr|\/mo/);
});
