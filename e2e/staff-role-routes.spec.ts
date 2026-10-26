import { test, expect, type Page } from "@playwright/test";

/** Staff E2E roles — credentials via E2E_STAFF_<ROLE>_EMAIL / E2E_STAFF_<ROLE>_PASSWORD (never commit). */
const STAFF_ROLES = [
  "moderator",
  "content",
  "careers",
  "support",
  "tech",
  "admin",
] as const;

type StaffRole = (typeof STAFF_ROLES)[number];

function staffCredentials(role: StaffRole): { email: string; password: string } | null {
  const key = role.toUpperCase();
  const email = process.env[`E2E_STAFF_${key}_EMAIL`]?.trim();
  const password = process.env[`E2E_STAFF_${key}_PASSWORD`]?.trim();
  if (!email || !password) return null;
  return { email, password };
}

async function loginStaff(page: Page, email: string, password: string) {
  await page.goto("/lex", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.getByLabel(/work email/i).fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /sign in to console/i }).click();
  await page.waitForURL((url) => !url.pathname.endsWith("/lex") || url.search.length > 0, {
    timeout: 30_000,
  });
}

type RouteExpectation = {
  path: string;
  /** If set, pathname must match after navigation settles */
  expectPath?: RegExp;
  /** If set, must redirect away from path prefix */
  expectNotPath?: RegExp;
};

const ROLE_MATRIX: Record<StaffRole, { allowed: RouteExpectation[]; denied: RouteExpectation[] }> = {
  moderator: {
    allowed: [{ path: "/lex/auth/listings", expectPath: /\/lex\/auth\/listings/ }],
    denied: [{ path: "/lex/auth/staff", expectNotPath: /\/lex\/auth\/staff/ }],
  },
  content: {
    allowed: [{ path: "/lex/auth/featured", expectPath: /\/lex\/auth\/featured/ }],
    denied: [{ path: "/lex/auth/staff", expectNotPath: /\/lex\/auth\/staff/ }],
  },
  careers: {
    allowed: [{ path: "/lex/auth/careers", expectPath: /\/lex\/auth\/careers/ }],
    denied: [{ path: "/lex/auth/listings", expectNotPath: /\/lex\/auth\/listings/ }],
  },
  support: {
    allowed: [{ path: "/lex/support", expectPath: /\/lex\/support/ }],
    denied: [{ path: "/lex/auth/overview", expectNotPath: /\/lex\/auth\/overview/ }],
  },
  tech: {
    allowed: [{ path: "/lex/tech", expectPath: /\/lex\/tech/ }],
    denied: [{ path: "/lex/auth/overview", expectNotPath: /\/lex\/auth\/overview/ }],
  },
  admin: {
    allowed: [{ path: "/lex/auth/overview", expectPath: /\/lex\/auth\/overview/ }],
    denied: [],
  },
};

for (const role of STAFF_ROLES) {
  test.describe(`staff role smoke: ${role}`, () => {
    test.beforeEach(() => {
      const creds = staffCredentials(role);
      test.skip(!creds, `Set E2E_STAFF_${role.toUpperCase()}_EMAIL and E2E_STAFF_${role.toUpperCase()}_PASSWORD`);
    });

    for (const spec of ROLE_MATRIX[role].allowed) {
      test(`allowed ${spec.path}`, async ({ page }) => {
        const creds = staffCredentials(role)!;
        await loginStaff(page, creds.email, creds.password);
        await page.goto(spec.path, { waitUntil: "domcontentloaded", timeout: 60_000 });
        if (spec.expectPath) {
          await expect(page).toHaveURL(spec.expectPath, { timeout: 20_000 });
        }
      });
    }

    for (const spec of ROLE_MATRIX[role].denied) {
      test(`denied ${spec.path}`, async ({ page }) => {
        const creds = staffCredentials(role)!;
        await loginStaff(page, creds.email, creds.password);
        await page.goto(spec.path, { waitUntil: "domcontentloaded", timeout: 60_000 });
        if (spec.expectNotPath) {
          await expect(page).not.toHaveURL(spec.expectNotPath, { timeout: 20_000 });
        }
      });
    }
  });
}
