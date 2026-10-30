import { test, expect } from "@playwright/test";

const isolated = process.env.E2E_ISOLATED_SUPABASE === "1";

test.describe("Marketplace search filters (isolated DB)", () => {
  test.skip(!isolated, "Requires E2E_ISOLATED_SUPABASE=1 and seeded sample listings");

  test("property: title search, budget via min_price, detail link", async ({
    page,
  }) => {
    await page.goto("/search?q=Lekki&city=Lagos&min_price=3000000", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page.getByTestId("marketplace-submitted-results")).toBeVisible();
    const card = page.getByRole("link").filter({ hasText: /Lekki/i }).first();
    await expect(card).toBeVisible();
    const href = await card.getAttribute("href");
    expect(href).toMatch(/\/properties\//);
    await page.goto(href!, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/sample-3bed-flat-lekki-rent|\/properties\//);
    await expect(page.getByText(/Lekki/i).first()).toBeVisible();
  });

  test("vehicles: sort price asc and pagination without duplicates", async ({
    page,
  }) => {
    await page.goto("/vehicles?sort=price_asc", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page.getByTestId("marketplace-submitted-results")).toBeVisible();

    const page1Titles = await page
      .locator("[data-testid='marketplace-submitted-results'] a[href*='/vehicles/']")
      .evaluateAll((els) =>
        els.map((a) => (a as HTMLAnchorElement).href).filter(Boolean),
      );
    expect(page1Titles.length).toBeGreaterThan(0);

    await page.goto("/vehicles?sort=price_asc&page=2", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    const page2Titles = await page
      .locator("[data-testid='marketplace-submitted-results'] a[href*='/vehicles/']")
      .evaluateAll((els) =>
        els.map((a) => (a as HTMLAnchorElement).href).filter(Boolean),
      );
    for (const url of page2Titles) {
      expect(page1Titles).not.toContain(url);
    }
  });

  test("electronics: keyword and clear filters", async ({ page }) => {
    await page.goto("/electronics?q=samsung", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page.getByTestId("marketplace-submitted-results")).toBeVisible();
    await expect(page.getByText(/samsung/i).first()).toBeVisible();

    await page.goto("/electronics", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page.getByTestId("electronics-discovery-search")).toBeVisible();
    await expect(page.getByTestId("marketplace-submitted-results")).toHaveCount(0);
  });
});
