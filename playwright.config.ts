import { defineConfig } from "@playwright/test";

const playwrightTestPepper =
  process.env.YIKE_PIN_PEPPER ??
  "playwright-local-test-pepper-minimum-32-chars";

/**
 * Local dev usually runs `npm run dev` on port 3000.
 * CI / production-build smoke can use `next start` on PLAYWRIGHT_PORT (default 3000).
 *
 * Override anytime: PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000
 * Reuse an already-running server: PLAYWRIGHT_SKIP_SERVER=1
 */
const playwrightPort = Number(process.env.PLAYWRIGHT_PORT ?? "3000");
const defaultBaseUrl = `http://127.0.0.1:${Number.isFinite(playwrightPort) ? playwrightPort : 3000}`;

const baseURL = (process.env.PLAYWRIGHT_BASE_URL ?? defaultBaseUrl).replace(/\/$/, "");

const skipServer = Boolean(process.env.PLAYWRIGHT_SKIP_SERVER);

/** `next dev` for day-to-day; set PLAYWRIGHT_WEB_COMMAND='npm run start -- -p 3000' for prod-build smoke */
const webCommand =
  process.env.PLAYWRIGHT_WEB_COMMAND?.trim() ||
  `npm run dev -- -p ${playwrightPort}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL,
  },
  webServer: skipServer
    ? undefined
    : {
        command: webCommand,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          ...process.env,
          APP_ENV: process.env.APP_ENV ?? "development",
          YIKE_PIN_PEPPER: playwrightTestPepper,
          CRON_SECRET:
            process.env.CRON_SECRET ?? "playwright-test-cron-secret-minimum",
        },
      },
});
