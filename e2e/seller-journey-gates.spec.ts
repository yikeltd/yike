import { test, expect } from "@playwright/test";

test.describe("seller journey gates (unauthenticated)", () => {
  test("sell entry redirects to login with next=listing workspace", async ({ page }) => {
    await page.goto("/agent/listings/choose", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Fagent%2Flistings%2Fnew/);
  });

  test("/sell alias reaches listing workspace login gate", async ({ page }) => {
    await page.goto("/sell", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Fagent%2Flistings%2Fnew/);
  });

  test("legacy vehicle wizard redirects to unified workspace login", async ({ page }) => {
    await page.goto("/agent/listings/vehicle", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/auth\/login\?next=.*listings(%2F|\/)new/);
  });

  test("legacy property URL redirects to unified workspace login", async ({ page }) => {
    await page.goto("/agent/listings/new/property", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Fagent%2Flistings%2Fnew/);
  });

  test("open redirect blocked on login next", async ({ page }) => {
    await page.goto("/auth/login?next=https://evil.example/phish", {
      waitUntil: "networkidle",
    });
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page).toHaveURL(/next=%2F|next=%252F|\?next=\/|login\?next=/);
    expect(page.url()).not.toContain("evil.example");
  });
});
