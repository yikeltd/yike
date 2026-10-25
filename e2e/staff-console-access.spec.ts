import { test, expect } from "@playwright/test";

test.describe("staff console access (browser routes)", () => {
  test("/admin returns 404 (no redirect to /lex)", async ({ page }) => {
    const res = await page.goto("/admin", { waitUntil: "commit" });
    expect(res?.status()).toBe(404);
    await expect(page).not.toHaveURL(/\/lex/);
    const body = await page.content();
    expect(body.toLowerCase()).not.toContain("yike ops");
    expect(body.toLowerCase()).not.toContain("sign in to console");
  });

  test("/admin/nested returns 404", async ({ request }) => {
    const res = await request.get("/admin/overview");
    expect(res.status()).toBe(404);
  });

  test("/lex serves staff login", async ({ page }) => {
    await page.goto("/lex", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Yike Ops")).toBeVisible();
    await expect(page.getByLabel(/work email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in to console/i })).toBeVisible();
  });

  test("anonymous /lex/auth/overview redirects to staff login", async ({ page }) => {
    await page.goto("/lex/auth/overview", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/lex$/);
  });

  test("consumer login is separate from staff login", async ({ page }) => {
    await page.goto("/auth/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/welcome back/i)).toBeVisible();
    await expect(page.getByText("Yike Ops")).not.toBeVisible();
  });

  test("staff verify-access rejects anonymous callers", async ({ request }) => {
    const res = await request.post("/api/staff/verify-access");
    expect(res.status()).toBe(401);
    const body = (await res.json()) as { ok?: boolean };
    expect(body.ok).not.toBe(true);
  });
});
