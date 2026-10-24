import { test, expect } from "@playwright/test";

test.describe("seller journey gates (unauthenticated)", () => {
  test("choose listing redirects to login with next=choose", async ({ page }) => {
    await page.goto("/agent/listings/choose", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Fagent%2Flistings%2Fchoose/);
  });

  test("legacy vehicle wizard redirects to gated new vehicle login", async ({ page }) => {
    await page.goto("/agent/listings/vehicle", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Fagent%2Flistings%2Fnew%2Fvehicle/);
  });

  test("new property listing requires auth", async ({ page }) => {
    await page.goto("/agent/listings/new/property", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Fagent%2Flistings%2Fnew%2Fproperty/);
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
