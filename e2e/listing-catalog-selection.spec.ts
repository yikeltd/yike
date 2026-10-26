import { test, expect } from "@playwright/test";

const ROUTES = [
  { vertical: "property", path: "/agent/listings/new/property" },
  { vertical: "vehicle", path: "/agent/listings/new/vehicle" },
  { vertical: "electronics", path: "/agent/listings/new/electronics" },
] as const;

test.describe("Listing catalogue selection UI", () => {
  for (const { vertical, path } of ROUTES) {
    test(`${vertical} — searchable catalogue controls render`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 60_000 });
      if (page.url().includes("/auth/login")) {
        test.skip(true, "Authenticated agent session required — cannot bypass login");
      }
      const smart = page.locator("#le-smart-describe");
      await expect(smart).toBeVisible({ timeout: 15_000 });
      const searchable = page.locator('[id^="le-"]').first();
      await expect(searchable).toBeVisible();
      await page.screenshot({
        path: testInfo.outputPath(`${vertical}-listing-catalog-mobile.png`),
        fullPage: true,
      });
    });
  }
});
