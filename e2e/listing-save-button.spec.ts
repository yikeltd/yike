import { test, expect } from "@playwright/test";

test.describe.configure({ timeout: 120_000 });

test.describe("Listing save control on cards", () => {
  test("mobile: browse card save toggles without route change", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/electronics", {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });

    const saveBtn = page.getByTestId("listing-save-button").first();
    await expect(saveBtn).toBeVisible({ timeout: 45_000 });
    await expect(saveBtn).toHaveAttribute("data-variant", "card-overlay");
    assertTouchTarget(await saveBtn.boundingBox());

    const beforeUrl = page.url();
    await saveBtn.click();
    await page.waitForTimeout(400);
    expect(page.url()).toBe(beforeUrl);

    await expect(saveBtn).toHaveAttribute("aria-pressed", "true");
    await expect(saveBtn).toHaveAttribute("aria-label", "Remove saved listing");
  });

  test("desktop: featured rail save buttons are consistent overlay controls", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 90_000 });

    const saveBtn = page.getByTestId("listing-save-button").first();
    await expect(saveBtn).toBeVisible({ timeout: 45_000 });

    const box = await saveBtn.boundingBox();
    assertTouchTarget(box);

    await saveBtn.focus();
    await expect(saveBtn).toBeFocused();
  });

  test("property homepage rail uses overlay save on imagery", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/?category=property", {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });

    const saveBtn = page.getByTestId("listing-save-button").first();
    await expect(saveBtn).toBeVisible({ timeout: 45_000 });
    await expect(saveBtn).toHaveAttribute("data-variant", "card-overlay");
  });
});

function assertTouchTarget(box: { width: number; height: number } | null) {
  expect(box).not.toBeNull();
  if (!box) return;
  expect(box.width).toBeGreaterThanOrEqual(43);
  expect(box.height).toBeGreaterThanOrEqual(43);
}
