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
npm run dev
npm run build
node scripts/optimize-brand-assets.mjs   # regenerate favicons from logo.png
```

## Supabase

Migration: `supabase/migrations/20250604000000_initial_schema.sql`  
Promote admin: `UPDATE profiles SET role = 'admin' WHERE id = '...';`
