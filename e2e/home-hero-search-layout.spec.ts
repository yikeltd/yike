import { test, expect, type Page, type Locator } from "@playwright/test";

test.describe.configure({ timeout: 120_000 });

async function assertNoHeroFeedOverlap(hero: Locator, searchCta: Locator, latest: Locator) {
  await expect(searchCta).toBeVisible();
  await expect(latest).toBeVisible();

  const heroBox = await hero.boundingBox();
  const ctaBox = await searchCta.boundingBox();
  const latestBox = await latest.boundingBox();

  expect(heroBox).not.toBeNull();
  expect(ctaBox).not.toBeNull();
  expect(latestBox).not.toBeNull();

  const heroBottom = heroBox!.y + heroBox!.height;
  const ctaBottom = ctaBox!.y + ctaBox!.height;

  expect(heroBottom).toBeGreaterThanOrEqual(ctaBottom - 4);
  expect(latestBox!.y).toBeGreaterThanOrEqual(heroBottom - 6);
}

async function openMobileFilters(page: Page, category: "property" | "vehicle" | "electronics") {
  await page.goto(`/?category=${category}`, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  const hero = page.locator("#home-search");
  await expect(hero).toBeVisible({ timeout: 45_000 });
  const tabName =
    category === "vehicle" ? "Vehicles" : category === "electronics" ? "Electronics" : "Properties";
  const tab = hero.getByRole("tab", { name: tabName });
  if ((await tab.getAttribute("aria-selected")) !== "true") {
    await tab.click();
    await page.waitForURL(new RegExp(`category=${category}`), { timeout: 20_000 });
  }
  const expanded = hero.getByTestId("home-mobile-filters-expanded");
  if (!(await expanded.isVisible())) {
    await hero.getByTestId("home-mobile-filters-toggle").click();
  }
  await expect(expanded).toBeVisible({
    timeout: 15_000,
  });
  return hero;
}

test.describe("Mobile hero search layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test("vehicles: expanded search stays inside hero above Latest on Yike", async ({ page }) => {
    const hero = await openMobileFilters(page, "vehicle");
    await hero.getByRole("button", { name: "Category", exact: true }).click();
    await page.getByRole("option", { name: "Cars" }).click();

    const latest = page.locator("section.home-latest-on-yike");
    await assertNoHeroFeedOverlap(
      hero,
      hero.getByTestId("home-mobile-search-cta"),
      latest,
    );
    await expect(page.getByTestId("home-unified-search-bar")).toBeVisible();
  });

  test("properties: rent chip expands hero without overlapping feed", async ({ page }) => {
    const hero = await openMobileFilters(page, "property");
    await hero.getByRole("button", { name: "Rent", exact: true }).click();

    const latest = page.locator("section.home-latest-on-yike");
    await assertNoHeroFeedOverlap(
      hero,
      hero.getByTestId("home-mobile-search-cta"),
      latest,
    );
  });

  test("electronics: category selection pushes feed downward", async ({ page }) => {
    const hero = await openMobileFilters(page, "electronics");
    await hero.getByRole("button", { name: "Electronics category", exact: true }).click();
    const firstOption = page.getByRole("option").nth(1);
    await firstOption.click();

    const latest = page.locator("section.home-latest-on-yike");
    await assertNoHeroFeedOverlap(
      hero,
      hero.getByTestId("home-mobile-search-cta"),
      latest,
    );
  });

  test("done hides search controls but keeps filter summary", async ({ page }) => {
    const hero = await openMobileFilters(page, "vehicle");
    await hero.getByRole("button", { name: "Category", exact: true }).click();
    await page.getByRole("option", { name: "Cars" }).click();
    await expect(hero.getByTestId("home-mobile-search-cta")).toBeVisible();

    await hero.getByTestId("home-mobile-filters-done").click();
    await expect(hero.getByTestId("home-mobile-filters-expanded")).toHaveCount(0);
    await expect(hero.getByTestId("home-mobile-search-cta")).toHaveCount(0);
    await expect(page.getByTestId("home-unified-search-bar")).toBeVisible();
    await expect(hero.getByTestId("home-mobile-filters-toggle")).toContainText(/Cars/i);

    await hero.getByTestId("home-mobile-filters-toggle").click();
    await expect(hero.getByTestId("home-mobile-search-cta")).toBeVisible();
  });

  test("reset clears filters and collapses search disclosure", async ({ page }) => {
    const hero = await openMobileFilters(page, "property");
    await hero.getByRole("button", { name: "Buy", exact: true }).click();
    await expect(hero.getByTestId("home-mobile-search-cta")).toBeVisible();

    await hero.getByTestId("home-mobile-filters-reset").click();
    await expect(hero.getByTestId("home-mobile-search-cta")).toHaveCount(0);
    await expect(page.getByTestId("home-unified-search-bar")).toBeVisible();
    await expect(hero.getByRole("button", { name: "Buy", exact: true })).not.toHaveClass(
      /bg-gold/,
    );
  });
});

test.describe("Desktop hero search layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  test("vehicles: search control sits above Latest on Yike", async ({ page }) => {
    await page.goto("/?category=vehicle", { waitUntil: "domcontentloaded", timeout: 90_000 });
    const heroPanel = page.locator("#home-desktop-search");
    await expect(heroPanel).toBeVisible({ timeout: 45_000 });

    await heroPanel.getByRole("button", { name: "Cars", exact: true }).click();
    const searchBtn = heroPanel.getByRole("button", { name: "Search vehicles" });
    await expect(searchBtn).toBeVisible();

    const desktopHero = page.locator('[aria-label="Desktop marketplace hero"]');
    const latest = page.getByTestId("home-desktop-latest-on-yike");
    await assertNoHeroFeedOverlap(desktopHero, searchBtn, latest);
  });
});
