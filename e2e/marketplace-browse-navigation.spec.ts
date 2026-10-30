import { test, expect } from "@playwright/test";

test.describe("Marketplace browse return navigation", () => {
  test("listing back restores search query from browseReturn", async ({ page }) => {
    await page.goto("/search?marketplace=all", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    const listingLink = page.locator('a[href*="/properties/"]').first();
    const linkCount = await listingLink.count();
    test.skip(linkCount === 0, "No property listings in search feed");

    const href = await listingLink.getAttribute("href");
    expect(href).toBeTruthy();

    if (!href!.includes("browseReturn=")) {
      await listingLink.click();
      await page.waitForURL(/\/properties\//, { timeout: 30_000 });
      expect(page.url()).toContain("browseReturn=");
    } else {
      await page.goto(href!, { waitUntil: "domcontentloaded", timeout: 60_000 });
    }

    const back = page.getByRole("link", { name: "Go back" }).first();
    await expect(back).toBeVisible({ timeout: 15_000 });
    await back.click();

    await expect(page).toHaveURL(/\/search\?.*marketplace=all/, { timeout: 30_000 });
  });

  test("direct listing URL with browseReturn lands and returns to agent listings", async ({
    page,
  }) => {
    const returnPath = encodeURIComponent("/agent/listings");
    await page.goto(`/search?marketplace=all`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    const listingLink = page.locator('a[href*="/properties/"]').first();
    test.skip((await listingLink.count()) === 0, "No listings available");

    let detailHref = (await listingLink.getAttribute("href")) ?? "";
    if (!detailHref.includes("browseReturn=")) {
      detailHref = detailHref.includes("?")
        ? `${detailHref}&browseReturn=${returnPath}`
        : `${detailHref}?browseReturn=${returnPath}`;
    } else {
      detailHref = detailHref.replace(
        /browseReturn=[^&]+/,
        `browseReturn=${returnPath}`
      );
    }

    await page.goto(detailHref, { waitUntil: "domcontentloaded", timeout: 60_000 });
    const back = page.getByRole("link", { name: "Go back" }).first();
    await expect(back).toBeVisible({ timeout: 15_000 });
    await back.click();
    await expect(page).toHaveURL(/\/agent\/listings/, { timeout: 30_000 });
  });

  test("login next coerced to consumer browse when signing in from search", async ({
    page,
  }) => {
    const res = await page.goto(
      "/auth/login?next=%2Fagent%2Flistings",
      {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
        referer: "http://127.0.0.1:3000/search?marketplace=all",
      }
    );
    expect(res?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/next=%2Fsearch/, { timeout: 15_000 });
  });
});
