# Deployment Failure Root Cause

**Date:** 2026-07-26  
**Investigated commit (TypeScript failure):** `c56ae5c929a9ac687ee7cdefa3a8fe31b320429a`  
**Fix commit (already on `main`):** `a0cbabb33a5743ebf0541927b77777a026a9be10`  
**Current `main` (post-OOM harden):** `7fd0362395de8e76ce33eb182a3f7361d49ac920`  
**Method:** Local reproduction + Coolify log comparison. No speculative fixes in this report.

---

## Verdict

Coolify’s TypeScript-stage failure is an exact, reproducible type error:

| Item | Value |
|------|--------|
| **Exact failing file** | `src/lib/design/listing-badges.ts` |
| **Exact failing line** | **80** (`resolvePlacementKind(property)`) |
| **Error code** | TS2345 |
| **Coolify message** | `Failed to type check.` then Next build worker exit `1` |
| **Root cause** | `resolveListingBadges` passes a `Pick<Property, …>` **without `id`** into `resolvePlacementKind`, whose parameter type `PlacementListing` **required `id`** on commit `c56ae5c9` |

This is **not** caused by missing env vars, generated types, middleware/edge warnings, dynamic imports, or production-only runtime paths.

---

## 1. Local commands (as requested)

### `npm run type-check`

**Result:** script does not exist.

```text
npm error Missing script: "type-check"
npm error Did you mean this?
npm error   npm run typecheck # run the "typecheck" package script
```

Canonical script: `npm run typecheck` → `tsc --noEmit`.

### `npm run typecheck` (current `main` @ `7fd03623`)

```text
> yike@0.1.0 typecheck
> tsc --noEmit

EXIT: 0
```

No TypeScript errors on current `main`.

### `npm run build` (current `main` @ `7fd03623`)

Relevant stages:

```text
✓ Compiled successfully in 42s
  Running TypeScript ...
  Finished TypeScript in 29.7s ...
  Collecting build traces ...
…
BUILD_EXIT:0
```

Local production build **succeeds**, including the TypeScript validation stage.

---

## 2. Coolify log (TypeScript failure) — complete error

**Deploy:** `yikeltd/yike:main` @ **`c56ae5c9`**  
**Time:** 2026-Jul-26 ~14:10–14:12 UTC  
**Exit:** Docker `npm run build` → exit code **1** (not 255)

Exact Coolify output:

```text
✓ Compiled successfully in 82s
Running TypeScript ...
Failed to type check.

./src/lib/design/listing-badges.ts:80:30
Type error: Argument of type 'Pick<Property, "yike_verified" | "listing_type" | "status" | "availability_status" | "is_featured" | "featured_until" | "is_premium_deal" | "is_boosted" | "boosted_until" | ... 6 more ... | "extras">' is not assignable to parameter of type 'PlacementListing'.
Property 'id' is missing in type 'Pick<Property, "yike_verified" | "listing_type" | "status" | "availability_status" | "is_featured" | "featured_until" | "is_premium_deal" | "is_boosted" | "boosted_until" | ... 6 more ... | "extras">' but required in type 'PlacementListing'.

78 | options?.featuredActive === true
79 | ? ("featured" as const)
> 80 | : resolvePlacementKind(property);
   | ^
81 | if (placement === "featured") {
82 | badges.push("featured");
83 | } else if (placement === "trending") {

Next.js build worker exited with code: 1 and signal: null
ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
```

Call site (unchanged on `main`; still line 80):

```77:80:src/lib/design/listing-badges.ts
  const placement =
    options?.featuredActive === true
      ? ("featured" as const)
      : resolvePlacementKind(property);
```

`resolveListingBadges`’s `property` parameter intentionally omits `id` (lines 40–58). On `c56ae5c9`, `PlacementListing` included `| "id"`.

---

## 3. Local vs Coolify comparison

| Check | Coolify @ `c56ae5c9` | Local @ `c56ae5c9` type shape | Local @ current `main` |
|-------|----------------------|-------------------------------|-------------------------|
| Webpack compile | ✓ success | n/a | ✓ success |
| TypeScript stage | **Failed to type check** | **Same TS2345** at `listing-badges.ts:80` | ✓ Finished TypeScript |
| Exit | `1` | `tsc` exit `2` | `0` |

### Local reproduction of Coolify’s exact error

Restored only `PlacementListing` from `c56ae5c9` (re-added required `"id"`), then ran `npm run typecheck`:

```text
src/lib/design/listing-badges.ts(80,30): error TS2345: Argument of type 'Pick<Property, …>' is not assignable to parameter of type 'PlacementListing'.
  Property 'id' is missing in type '…' but required in type 'PlacementListing'.
TSC_C56_EXIT:2
```

Restored current `placement.ts` → `TSC_RESTORED_EXIT:0`.

**Conclusion:** Coolify and local TypeScript agree on the same error for the same types. There is no Coolify-only typechecker quirk here.

---

## 4. Why it looked like “deployment only”

It does **not** only appear on Coolify.

Evidence:

1. Same `tsc --noEmit` failure reproduces locally when `PlacementListing` still requires `id`.
2. Coolify simply runs `Dockerfile` → `npm run build` → Next.js **“Running TypeScript …”**, which enforces the same assignability rule.
3. It surfaced on deploy because that was the first full production `next build` gate on RC1 commit `c56ae5c9` after `PlacementListing` gained `"id"` while `resolveListingBadges` continued to pass a pick **without** `id`.

Checked and **ruled out** as causes of this TypeScript failure:

| Hypothesis | Finding |
|------------|---------|
| Missing environment variables | No — pure type assignability; no env reads at the failing site |
| Build-time env usage | No |
| Different TypeScript strictness on Coolify | No — identical TS2345 locally |
| Generated / missing types | No — both sides use `Property` / `PlacementListing` from source |
| Next.js 16-only behavior | No — `tsc --noEmit` fails the same way |
| Middleware / Edge / Supabase warnings | Present in logs as **warnings**; TypeScript stage still completed or failed independently |
| Dynamic imports | No |
| Production-only code paths | No — types only; no `NODE_ENV` branch involved |

---

## 5. Root cause (precise)

On `c56ae5c9`:

- `PlacementListing` = `Pick<Property, "id" | "is_featured" | …>`
- `resolvePlacementKind(listing: PlacementListing)` therefore required `id`
- `resolveListingBadges(property: Pick<Property, …>)` **does not include `id`**
- Line 80: `resolvePlacementKind(property)` → **TS2345**

`id` was not used by `resolvePlacementKind` / trending / new placement helpers. It was only needed later by `softBoostFeaturedPlacement` for sorting — that function can require `id` on its generic bound without forcing every badge call site to pass `id`.

---

## 6. Minimal fix (already on `main`)

**Commit:** `a0cbabb3` — `fix(build): drop unused id from PlacementListing for badge resolve.`

Diff (behavioral types only):

1. Remove `"id"` from `PlacementListing`.
2. Narrow `softBoostFeaturedPlacement` to `T extends PlacementListing & { id: string }` so feed soft-boost still requires `id` where sorting needs it.

**Functionality:** No runtime behavior change for badges or placement resolution. `resolvePlacementKind` never read `id`. Soft-boost callers that already pass full listings with `id` remain valid.

**Confirmation on current `main`:**

- `npm run typecheck` → exit `0`
- `npm run build` → TypeScript **Finished**; overall exit `0`

---

## 7. Related later failure (do not conflate)

A **second** Coolify deploy of **`a0cbabb3`** (after the TypeScript fix) compiled and **Finished TypeScript**, generated all static pages, then died with **exit code 255** — after SSG, during/after the post-static phase (typical OOM / process kill). That is **not** a TypeScript validation failure.

Mitigation shipped separately as `7fd03623` (multi-stage Dockerfile, 4GB heap, `NEXT_BUILD_CPUS=1`, standalone output). See `docs/engineering/DEPLOYMENT_STANDARD.md`.

| Commit | Coolify stage that failed | Exit | Cause |
|--------|---------------------------|------|-------|
| `c56ae5c9` | Running TypeScript | `1` | TS2345 `listing-badges.ts:80` |
| `a0cbabb3` | After static pages (TS passed) | `255` | Host killed build (memory) |
| `7fd03623` | — | — | Memory harden; local build green |

---

## 8. What to do next

1. Treat the **TypeScript** root cause as **closed** by `a0cbabb3` (verified locally).
2. Watch Coolify for `7fd03623` (or later) for a **full** successful image build past “Collecting build traces”.
3. Always run `npm run typecheck` **and** `npm run build` before relying on Coolify as the type gate.
4. Use script name **`typecheck`**, not `type-check`.
