import { test, expect } from "@playwright/test";

const TEST_QUERY = "yike_test_verified_dealers=1";

test.describe("Home verified dealers section", () => {
  test("desktop shows section after Recently Added with spec heading", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/?${TEST_QUERY}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    const section = page
      .getByTestId("home-desktop-view")
      .getByTestId("home-verified-dealers-section");
    await expect(section).toBeVisible({ timeout: 20_000 });
    await expect(
      section.getByRole("heading", { name: "🛡️ Verified Dealers & Developers" }),
    ).toBeVisible();
    await expect(
      section.getByText("Trusted businesses with live inventory on Yike"),
    ).toBeVisible();
    await expect(section.getByText("Fixture Auto Dealer")).toBeVisible();
    await expect(section.getByText("Fixture Developer Ltd")).toBeVisible();
    await expect(section.getByText("Fixture Tech Hub")).toBeVisible();

    const recentHeading = page
      .getByTestId("home-desktop-view")
      .getByRole("heading", { name: "Recently Added" });
    await expect(recentHeading).toBeVisible();
    const recentBox = await recentHeading.boundingBox();
    const sectionBox = await section.boundingBox();
    assertOrder(recentBox, sectionBox);

    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth > el.clientWidth + 2;
    });
    expect(overflow).toBe(false);
  });

  test("mobile shows same section in document order", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/?${TEST_QUERY}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    const section = page
      .locator("div.lg\\:hidden")
      .getByTestId("home-verified-dealers-section");
    await expect(section).toBeVisible({ timeout: 20_000 });

    const order = await page.evaluate(() => {
      const headings = [...document.querySelectorAll("h2")].map((h) =>
        h.textContent?.trim(),
      );
      const trendIdx = headings.findIndex((t) => t === "Trending");
      const recentIdx = headings.findIndex((t) => t?.startsWith("Recently"));
      const verifiedIdx = headings.findIndex((t) =>
        t?.includes("Verified Dealers"),
      );
      return { trendIdx, recentIdx, verifiedIdx };
    });
    expect(order.trendIdx).toBeGreaterThanOrEqual(0);
    expect(order.recentIdx).toBeGreaterThan(order.trendIdx);
    expect(order.verifiedIdx).toBeGreaterThan(order.recentIdx);
  });

  test("section hidden when no eligible dealers (no test fixture)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    const count = await page.getByTestId("home-verified-dealers-section").count();
    if (count > 0) {
      await expect(page.getByText("Fixture Auto Dealer")).toHaveCount(0);
      return;
    }
    expect(count).toBe(0);
  });
});

function assertOrder(
  above: { y: number; height: number } | null,
  below: { y: number; height: number } | null,
) {
  if (!above || !below) return;
  expect(below.y).toBeGreaterThanOrEqual(above.y);
}
