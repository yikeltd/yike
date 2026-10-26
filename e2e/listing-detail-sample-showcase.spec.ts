import { test, expect } from "@playwright/test";
import {
  sampleDetailPath,
  type SampleVertical,
} from "../src/lib/sample-listings/showcase";

const VERTICALS: SampleVertical[] = ["property", "vehicle", "electronics"];

async function assertSellerPanel(
  page: import("@playwright/test").Page,
  expectReviews: boolean,
) {
  const sellerCard = page.getByTestId("marketplace-seller-contact-card");
  await expect(sellerCard).toBeVisible({ timeout: 20_000 });
  await sellerCard.scrollIntoViewIfNeeded();
  await expect(sellerCard.getByRole("button", { name: /Message/i })).toHaveCount(0);

  const box = await sellerCard.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThan(280);

  await expect(page.getByTestId("seller-panel-divider")).toBeVisible();
  await expect(
    sellerCard.getByRole("heading", { level: 2, name: /Verified Nigerian Seller|Seller on Yike/i }),
  ).toBeVisible();

  if (expectReviews) {
    await expect(page.getByTestId("seller-reviews-preview")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("seller-reviews-preview").locator("article")).toHaveCount(
      3,
    );
  } else {
    await expect(page.getByTestId("seller-reviews-empty")).toBeVisible({
      timeout: 15_000,
    });
  }
}

async function assertSpecificationsGrid(page: import("@playwright/test").Page) {
  const section = page.getByTestId("listing-detail-specifications-section");
  await section.scrollIntoViewIfNeeded();
  await expect(section).toBeVisible({ timeout: 15_000 });
  const grid = page.getByTestId("listing-detail-specifications-grid");
  await expect(grid).toBeVisible();
  await expect(grid).toHaveClass(/sm:grid-cols-2/);

  const cellCount = await grid.locator(":scope > div").count();
  expect(cellCount).toBeGreaterThanOrEqual(6);

  const columns = await grid.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return style.gridTemplateColumns.split(" ").filter(Boolean).length;
  });
  expect(columns).toBe(2);

  const overflow = await grid.evaluate((el) => el.scrollWidth <= el.clientWidth + 2);
  expect(overflow).toBe(true);
}

test.describe("Sample listing detail showcase (local fixtures)", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      process.env.YIKE_SAMPLE_LISTINGS_FIXTURE === "0",
      "Sample fixtures explicitly disabled",
    );
  });

  for (const vertical of VERTICALS) {
    test(`${vertical} — seller panel + specs grid (desktop, with reviews)`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(sampleDetailPath(vertical, "withReviews"), {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      if (page.url().includes("/auth/login")) {
        test.skip(true, "Auth redirect — sample fixture route blocked");
      }
      await assertSellerPanel(page, true);
      await assertSpecificationsGrid(page);
      await page.screenshot({
        path: testInfo.outputPath(`${vertical}-desktop-with-reviews.png`),
        fullPage: true,
      });
    });

    test(`${vertical} — empty reviews (mobile)`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(sampleDetailPath(vertical, "emptyReviews"), {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      if (page.url().includes("/auth/login")) {
        test.skip(true, "Auth redirect — sample fixture route blocked");
      }
      await assertSellerPanel(page, false);
      const grid = page.getByTestId("listing-detail-specifications-grid");
      if ((await grid.count()) > 0) {
        const columns = await grid.evaluate((el) => {
          return window.getComputedStyle(el).gridTemplateColumns.split(" ").filter(Boolean)
            .length;
        });
        expect(columns).toBe(1);
      }
      await page.screenshot({
        path: testInfo.outputPath(`${vertical}-mobile-empty-reviews.png`),
        fullPage: true,
      });
    });
  }

  test("gallery contact has Message; seller panel does not (duplicate check)", async ({
    page,
  }) => {
    await page.goto(sampleDetailPath("property", "withReviews"), {
      waitUntil: "domcontentloaded",
    });
    if (page.url().includes("/auth/login")) {
      test.skip(true, "Auth blocked");
    }
    const gallery = page.getByTestId("listing-detail-gallery-contact");
    await expect(gallery).toBeVisible();
    await expect(gallery.getByRole("button", { name: /Message/i })).toBeVisible();
    await expect(
      page.getByTestId("marketplace-seller-contact-card").getByRole("button", {
        name: /Message/i,
      }),
    ).toHaveCount(0);
    await expect(page.getByTestId("listing-detail-location-section").locator("img")).toHaveCount(
      0,
    );
  });
});
