import { test, expect } from "@playwright/test";

const MOBILE_VIEW = { width: 390, height: 844 };
const DESKTOP_VIEW = { width: 1280, height: 800 };

test.describe("Discover navigation recovery", () => {
  test.setTimeout(90_000);

  test("mobile bottom nav and desktop header stay available on /discover", async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE_VIEW);
    await page.goto("/discover", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    const publicNav = page.getByRole("navigation", {
      name: /public navigation|authenticated navigation/i,
    });
    const bottomHome = publicNav.getByRole("link", { name: /^Home$/i });
    await expect(bottomHome).toBeVisible({ timeout: 15_000 });
    await expect(bottomHome).toHaveAttribute("href", "/");

    await page.setViewportSize(DESKTOP_VIEW);
    const desktopHeader = page.locator("header").filter({
      has: page.getByPlaceholder(/search|city|area/i),
    });
    await expect(desktopHeader.first()).toBeVisible({ timeout: 15_000 });
  });

  test("discover empty or deck end keeps bottom-nav Home escape hatch", async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE_VIEW);
    await page.goto("/discover", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    const publicNav = page.getByRole("navigation", {
      name: /public navigation|authenticated navigation/i,
    });
    const bottomHome = publicNav.getByRole("link", { name: /^Home$/i });
    await expect(bottomHome).toBeVisible({ timeout: 15_000 });

    const emptyState = page.getByTestId("discover-empty");
    let emptyVisible = await emptyState
      .waitFor({ state: "visible", timeout: 8_000 })
      .then(() => true)
      .catch(() => false);

    if (!emptyVisible) {
      await page.getByRole("button", { name: "Filter", exact: true }).first().click();
      const filterDialog = page.getByRole("dialog", { name: "Discover filters" });
      await expect(filterDialog).toBeVisible({ timeout: 15_000 });
      await filterDialog.getByRole("button", { name: "Featured only" }).click();
      await filterDialog.getByRole("button", { name: "Verified only" }).click();
      await filterDialog.getByRole("button", { name: "Show results" }).click();
      emptyVisible = await emptyState
        .waitFor({ state: "visible", timeout: 12_000 })
        .then(() => true)
        .catch(() => false);
    }

    test.skip(!emptyVisible, "Deck still has swipeable listings — empty state not shown");
    await expect(emptyState).toBeVisible();
    await bottomHome.click();
    await expect(page).toHaveURL(/\/(\?|$)/, { timeout: 15_000 });
  });

  test("YIKE eyebrow on discover links to homepage", async ({ page }) => {
    await page.goto("/discover", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    const brand = page.getByRole("link", { name: /^YIKE$/i });
    await expect(brand).toBeVisible({ timeout: 15_000 });
    await expect(brand).toHaveAttribute("href", "/");
  });
});
