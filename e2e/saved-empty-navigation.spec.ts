import { test, expect } from "@playwright/test";
import {
  createEphemeralSavedEmptyUser,
  deleteEphemeralUser,
  ephemeralAuthEnabled,
  type EphemeralSavedUser,
} from "./helpers/ephemeral-auth";

test.describe("Saved empty navigation", () => {
  test("guest empty saved browse CTA targets search", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("yike_guest_favorites");
    });
    await page.goto("/saved", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    await expect(
      page.getByRole("heading", { name: "Save homes you love" })
    ).toBeVisible({ timeout: 20_000 });

    const browse = page.getByTestId("saved-empty-browse-guest");
    await expect(browse).toBeVisible({ timeout: 15_000 });
    await expect(browse).toHaveAttribute("href", "/search");
    await browse.click();
    await expect(page).toHaveURL(/\/search/, { timeout: 15_000 });
  });

  test.describe("logged-in empty saved", () => {
    let ephemeral: EphemeralSavedUser | null = null;

    test.beforeAll(async () => {
      if (!ephemeralAuthEnabled()) return;
      ephemeral = await createEphemeralSavedEmptyUser();
    });

    test.afterAll(async () => {
      if (ephemeral?.userId) {
        await deleteEphemeralUser(ephemeral.userId);
      }
    });

    test("logged-in empty saved browse CTA targets search", async ({ browser }) => {
      test.skip(
        !ephemeral,
        "Set E2E_EPHEMERAL_AUTH=1 with non-production Supabase + service role in .env.local"
      );

      const user = ephemeral as EphemeralSavedUser;
      const context = await browser.newContext();
      const loginRes = await context.request.post("/api/auth/login", {
        data: {
          identifier: user.email,
          password: user.password,
        },
      });
      expect(loginRes.ok()).toBeTruthy();

      const page = await context.newPage();
      await page.goto("/saved", {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });

      const browse = page.getByTestId("saved-empty-browse");
      await expect(browse).toBeVisible({ timeout: 20_000 });
      await expect(browse).toHaveAttribute("href", "/search");
      await browse.click();
      await expect(page).toHaveURL(/\/search/, { timeout: 15_000 });
      await context.close();
    });
  });
});
