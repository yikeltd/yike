import { test, expect } from "@playwright/test";

test.describe("Unified search bar", () => {
  test("mobile unified search pill scrolls with page (not sticky)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    const bar = page
      .locator("div.flex.min-w-0.items-center.rounded-full.border")
      .filter({ has: page.getByRole("searchbox") })
      .first();
    await expect(bar).toBeVisible({ timeout: 15_000 });
    const before = await bar.boundingBox();
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(400);
    const after = await bar.boundingBox();
    expect(before && after).toBeTruthy();
    if (before && after) {
      expect(after.y).toBeLessThan(before.y);
    }
  });

  test("mixed marketplace search loads", async ({ page }) => {
    await page.goto("/search?marketplace=all", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    expect(page.url()).toContain("marketplace=all");
    await expect(page.getByRole("searchbox").first()).toBeVisible();
  });

  test("vehicles excavator category browse responds", async ({ page }) => {
    const res = await page.goto("/vehicles?category=excavator", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    expect(res?.status()).toBeGreaterThanOrEqual(200);
    expect(res?.status()).toBeLessThan(400);
  });
});
