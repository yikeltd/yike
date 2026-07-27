import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getCountryConfig,
  listConfiguredCountries,
  listLiveCountries,
  isCountryLive,
} from "@/lib/country/config";

describe("country metadata (Phase 2B Sprint 5)", () => {
  it("configures NG + KE + GH + UG + RW", () => {
    const all = listConfiguredCountries();
    assert.equal(all.length, 5);
    assert.deepEqual(
      all.map((c) => c.iso).sort(),
      ["GH", "KE", "NG", "RW", "UG"],
    );
  });

  it("marks only Nigeria as live", () => {
    assert.equal(listLiveCountries().length, 1);
    assert.equal(listLiveCountries()[0]?.iso, "NG");
    assert.equal(isCountryLive("NG"), true);
    assert.equal(isCountryLive("KE"), false);
  });

  it("defaults unknown ISO to Nigeria", () => {
    assert.equal(getCountryConfig("ZZ").iso, "NG");
    assert.equal(getCountryConfig(null).currency, "NGN");
  });

  it("keeps payment providers empty for prep markets", () => {
    assert.deepEqual(getCountryConfig("KE").paymentProviders, []);
    assert.ok(getCountryConfig("NG").paymentProviders.includes("paystack"));
  });
});
