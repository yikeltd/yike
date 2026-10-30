import { test, expect } from "@playwright/test";
import { sampleDetailPath } from "../src/lib/sample-listings/showcase";

const isolated = process.env.E2E_ISOLATED_SUPABASE === "1";

test.describe("Listing detail (isolated DB)", () => {
  test.skip(!isolated, "Requires E2E_ISOLATED_SUPABASE=1 and seeded samples");

  test("property: location matches title area, related are properties only", async ({
    page,
  }) => {
    await page.goto(sampleDetailPath("property", "withReviews"), {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page.getByText(/Maitama/i).first()).toBeVisible();
    await expect(page.getByText(/iPhone|Toyota Camry/i)).toHaveCount(0);
  });

  test("electronics: sale price without /yr, correct gadgets seller", async ({
    page,
  }) => {
    await page.goto(sampleDetailPath("electronics", "withReviews"), {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(
      page.getByRole("heading", { level: 1, name: /Samsung Galaxy/i }),
    ).toBeVisible();
    await expect(page.getByText(/680,000/)).toBeVisible();
    await expect(page.getByText(/\/yr/i)).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Message Sample Gadgets/i }),
    ).toBeVisible();
  });

  test("vehicle: direct URL loads specs and contact", async ({ page }) => {
    await page.goto(sampleDetailPath("vehicle", "withReviews"), {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(
      page.getByRole("heading", { level: 1, name: /Toyota Camry/i }),
    ).toBeVisible();
    await expect(page.getByTestId("listing-detail-gallery-contact")).toBeVisible();
    await expect(page.getByRole("button", { name: /Call Sample Motors/i })).toBeVisible();
  });

  test("invalid slug shows not found or unavailable", async ({ page }) => {
    const res = await page.goto("/vehicles/not-a-real-listing-slug-xyz", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    expect(res?.status()).toBeLessThan(500);
    await expect(
      page.getByText(/not found|unavailable|no longer/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});
