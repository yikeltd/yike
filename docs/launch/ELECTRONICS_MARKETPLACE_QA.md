# Electronics marketplace QA — 2026-10-23

**Baseline:** `main` @ `53bb79cfc5337e36aa6f8e222f5157872b547256`  
**Branch:** `qa/electronics-marketplace`

## Summary

Electronics is a **database-ready discriminator** (`asset_type = ELECTRONICS`) with universal listing-cap logic in migration `20261013120000`, but **not a functioning product vertical**. Registry status is `reserved`; there is no `/electronics` app surface, listing engine category, or create API.

## Staging DB tests

**BLOCKED** — staging Supabase (`gyxemepnrkwxocgzfbeo`) does not resolve from QA runner; no service role in sandbox env backup. Listing-limit concurrency for electronics rows is **NOT TESTED** live.

## Automated regression

```bash
npm run test:electronics-vertical
```

## Forward migrations

No new migration in this pass. When launching electronics, apply `20261013120000` on staging first (if not already), then ship vertical UI + `api/agent/electronics/create` (or listing-engine category) in a dedicated release.
