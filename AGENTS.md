# Yike.ng — Agent Guide

Read `.cursor/rules/yike-product-direction.mdc` before any change. Direction is **locked** unless the founder overrides it.

## Quick reference

- **Stack:** Next.js App Router, TypeScript, Tailwind, Supabase, Vercel
- **Colors:** Navy `#031B4E` · Gold `#E4B547`
- **Logo:** `public/images/logo.webp`
- **Media:** `src/lib/media/` — all uploads must use the optimization pipeline
- **MVP:** listings, search, trust, moderation — no payments/chat/AI

## Commands

```bash
npm run dev    # always run while building — preview at http://localhost:3000
npm run build  # production check before deploy
node scripts/optimize-brand-assets.mjs   # regenerate favicons from logo.png
```

**Local preview:** Start `npm run dev` at the beginning of UI work and open the affected routes locally before publishing to Vercel.

## Deploy

- **GitHub:** `yikeltd/yike` · **Vercel team:** `yikeprojects` · **project:** `yike`
- Push to `main` → Vercel production deploy automatically (Git integration — no manual step)
- Preview deploys on other branches / PRs
- Env vars: see `.env.example` (set in Vercel → Settings → Environment Variables)

## Supabase

- **Production project:** `hlpojfurfldvcxfxhveg` · `https://hlpojfurfldvcxfxhveg.supabase.co`
- **Migrations:** `supabase/migrations/` — apply **only new** files (SQL Editor on production, or `npm run db:push` locally). Do not re-run migrations already on production.
- **Check status:** `npm run db:status` (requires linked CLI)
- Admin console (private): `/lex` — staff login · `/lex/auth` command center · `/lex/support` · `/lex/tech`. Seed admin: `SUPABASE_SERVICE_ROLE_KEY=... npm run admin:ensure`
