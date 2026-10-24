import test from "node:test";
import assert from "node:assert/strict";
import {
  FREE_CONNECTED_VIDEO_CALLS_PER_DAY,
  YIKE_COINS_TIMEZONE,
  ngnToCoins,
  formatYikeCoins,
} from "@/lib/yike-coins/constants";

test("ngnToCoins uses 1:1 nominal mapping", () => {
  assert.equal(ngnToCoins(500), 500);
  assert.equal(ngnToCoins(0), 0);
});

test("formatYikeCoins uses official product name", () => {
  assert.match(formatYikeCoins(2), /Yike Coins/);
  assert.match(formatYikeCoins(1), /Yike Coin/);
});

test("free video allowance constant matches brief", () => {
  assert.equal(FREE_CONNECTED_VIDEO_CALLS_PER_DAY, 3);
  assert.equal(YIKE_COINS_TIMEZONE, "Africa/Lagos");
});
