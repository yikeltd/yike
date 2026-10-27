import { test, expect } from "@playwright/test";

test.describe("Instant listing workspace entry", () => {
  test("legacy /choose redirects to /new without category landing copy", async ({
    page,
  }) => {
    await page.goto("/agent/listings/choose", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(
      /\/agent\/listings\/new|\/auth\/login\?next=.*listings(%2F|\/)new/,
    );
    await expect(page.getByText("What are you selling?")).toHaveCount(0);
  });

  test("Sell CTA targets listing workspace (desktop header on search)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/search", { waitUntil: "domcontentloaded" });
    const sell = page.getByRole("link", { name: /^SELL$/i });
    await expect(sell).toBeVisible({ timeout: 15_000 });
    const href = await sell.getAttribute("href");
    expect(href).toMatch(/\/agent\/listings\/new|login\?next=.*listings(%2F|\/)new/);
  });

  test("post-property alias reaches listing workspace gate", async ({ page }) => {
    await page.goto("/post-property", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(
      /\/agent\/listings\/new|\/auth\/login\?next=.*listings(%2F|\/)new/,
    );
  });
});
