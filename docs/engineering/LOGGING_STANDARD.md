# Logging Standard — Yike

`src/instrumentation.ts` → `logStartupBanner()` on Node startup.

`LOG_LEVEL=info` in production. Never log OTP codes in production (dev-only fallbacks are gated).
