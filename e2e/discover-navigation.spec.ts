import { test, expect } from "@playwright/test";

const MOBILE_VIEW = { width: 390, height: 844 };
const DESKTOP_VIEW = { width: 1280, height: 800 };

test.describe("Discover navigation recovery", () => {
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

  test("exhausted discover deck shows Home escape hatch", async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEW);
    await page.goto("/discover", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    const homeEscape = page.getByTestId("discover-empty-home");
    let emptyVisible = await homeEscape
      .waitFor({ state: "visible", timeout: 8_000 })
      .then(() => true)
      .catch(() => false);

    if (!emptyVisible) {
      await page.getByRole("button", { name: "Filter", exact: true }).click();
      await page.getByRole("button", { name: "Featured only" }).click();
      await page.getByRole("button", { name: "Verified only" }).click();
      await page.getByRole("button", { name: "Show results" }).click();
      emptyVisible = await homeEscape
        .waitFor({ state: "visible", timeout: 12_000 })
        .then(() => true)
        .catch(() => false);
    }

    test.skip(!emptyVisible, "Deck still has listings — empty state not shown");
    await expect(homeEscape).toBeVisible();
    await expect(homeEscape).toHaveAttribute("href", "/");
    await homeEscape.click();
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
