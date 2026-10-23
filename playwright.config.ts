import { defineConfig } from "@playwright/test";

const playwrightTestPepper =
  process.env.YIKE_PIN_PEPPER ??
  "playwright-local-test-pepper-minimum-32-chars";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3001",
  },
  webServer: process.env.PLAYWRIGHT_SKIP_SERVER
    ? undefined
    : {
        command: "npm run start -- -p 3001",
        port: 3001,
        reuseExistingServer: !process.env.CI,
        env: {
          ...process.env,
          APP_ENV: process.env.APP_ENV ?? "development",
          YIKE_PIN_PEPPER: playwrightTestPepper,
          CRON_SECRET:
            process.env.CRON_SECRET ?? "playwright-test-cron-secret-minimum",
        },
      },
});
