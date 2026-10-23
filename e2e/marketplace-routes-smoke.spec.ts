import { test, expect } from "@playwright/test";

const routes = [
  "/",
  "/search",
  "/vehicles",
  "/electronics",
  "/agent/listings/choose",
];

for (const path of routes) {
  test(`GET ${path} responds`, async ({ page }) => {
    const res = await page.goto(path, { waitUntil: "domcontentloaded" });
    const status = res?.status() ?? 0;
    expect(status >= 200 && status < 400).toBeTruthy();
  });
}

test("homepage hero exposes three marketplace tabs", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?category=property", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("tab", { name: "Properties" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Vehicles" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Electronics" })).toBeVisible();
});

test("electronics category shows electronics filters on homepage", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/?category=electronics", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Electronics category" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Condition" })).toBeVisible();
});
