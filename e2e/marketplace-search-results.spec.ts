import { test, expect } from "@playwright/test";

const FIXTURE_BANNER = /Sample listings \(dev fixture\)/i;
const SEO_CHIP_LABELS = [
  "Verified",
  "SUV",
  "Diesel",
  "For Rent",
  "Duplex",
  "Under ₦5M",
  "Newest",
];

function submittedRoot(page: import("@playwright/test").Page) {
  return page.getByTestId("marketplace-submitted-results");
}

test.describe("Marketplace search results chrome", () => {
  test("property submitted search is listings-first", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/search?city=Lagos", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    const root = submittedRoot(page);
    await expect(root).toBeVisible();
    await expect(page.getByTestId("marketplace-discovery-search")).toHaveCount(0);
    await expect(page.getByTestId("marketplace-browse-discovery-section")).toHaveCount(0);
    await expect(root.getByTestId("marketplace-inpage-vertical-switcher")).toHaveCount(0);
    await expect(page.getByText(FIXTURE_BANNER)).toHaveCount(0);
    await expect(root.getByTestId("marketplace-refine-toggle")).toBeVisible();
    await expect(root.getByRole("button", { name: "Filters" })).toBeVisible();
    for (const label of SEO_CHIP_LABELS) {
      await expect(root.getByRole("link", { name: label, exact: true })).toHaveCount(0);
    }
  });

  test("vehicles submitted browse hides in-page tabs and SEO chips", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/vehicles?category=suv", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    const root = submittedRoot(page);
    await expect(root).toBeVisible();
    await expect(page.getByTestId("marketplace-discovery-search")).toHaveCount(0);
    await expect(root.getByTestId("marketplace-inpage-vertical-switcher")).toHaveCount(0);
    await expect(root.getByTestId("marketplace-refine-toggle")).toBeVisible();
    for (const label of SEO_CHIP_LABELS) {
      await expect(root.getByRole("link", { name: label, exact: true })).toHaveCount(0);
    }
  });

  test("electronics submitted search uses compact filters", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/electronics?q=samsung", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    const root = submittedRoot(page);
    await expect(root).toBeVisible();
    await expect(page.getByTestId("electronics-discovery-search")).toHaveCount(0);
    await expect(root.getByTestId("marketplace-inpage-vertical-switcher")).toHaveCount(0);
    await expect(root.getByTestId("marketplace-refine-toggle")).toBeVisible();
    await expect(page.getByText(FIXTURE_BANNER)).toHaveCount(0);
    await root.getByTestId("marketplace-refine-toggle").click();
    await expect(root.getByPlaceholder("Search brand, model, city…")).toBeVisible();
  });

  test("electronics discovery keeps initial search form and tabs", async ({ page }) => {
    await page.goto("/electronics", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page.getByTestId("electronics-discovery-search")).toBeVisible();
    await expect(page.getByTestId("marketplace-browse-discovery-section")).toBeVisible();
    await expect(
      page.getByTestId("marketplace-browse-discovery-section").getByTestId(
        "marketplace-inpage-vertical-switcher",
      ),
    ).toBeVisible();
  });

  test("property discovery keeps browse section", async ({ page }) => {
    await page.goto("/search", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.getByTestId("marketplace-browse-discovery-section")).toBeVisible();
    await expect(page.getByTestId("marketplace-submitted-results")).toHaveCount(0);
  });
});
