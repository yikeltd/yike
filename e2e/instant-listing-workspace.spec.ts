import { test, expect } from "@playwright/test";

test.describe.configure({ timeout: 60_000 });

const WORKSPACE_URL =
  /\/agent\/listings\/new|\/auth\/login\?next=.*listings(%2F|\/)new/;

test.describe("Instant listing workspace entry", () => {
  test("legacy /choose redirects to /new without category landing copy", async ({
    page,
  }) => {
    await page.goto("/agent/listings/choose", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(WORKSPACE_URL);
    await expect(page.getByText("What are you selling?")).toHaveCount(0);
  });

  test("legacy /choose preserves category and hint query params", async ({ page }) => {
    await page.goto(
      "/agent/listings/choose?category=vehicle&hint=toyota",
      { waitUntil: "domcontentloaded" },
    );
    await expect(page).toHaveURL(
      /\/agent\/listings\/new\?.*category=vehicle|login\?next=.*category(%3D|=)vehicle/,
    );
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

  test("post-property and /sell aliases reach listing workspace gate", async ({
    page,
  }) => {
    for (const path of ["/post-property", "/sell", "/list-property"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(WORKSPACE_URL);
    }
  });

  test("vertical shortcuts redirect to workspace with category param", async ({
    page,
  }) => {
    for (const [path, cat] of [
      ["/agent/listings/new/property", "property"],
      ["/agent/listings/new/vehicle", "vehicle"],
      ["/agent/listings/new/electronics", "electronics"],
    ] as const) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(
        new RegExp(
          `\\/agent\\/listings\\/new\\?.*category=${cat}|login\\?next=.*category(%3D|=)${cat}`,
        ),
      );
    }
  });

  test("footer Sell on Yike link targets workspace", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const sell = page.getByRole("link", { name: /Sell on Yike/i });
    await expect(sell.first()).toBeVisible({ timeout: 15_000 });
    const href = await sell.first().getAttribute("href");
    expect(href).toMatch(/\/agent\/listings\/new/);
  });
});
