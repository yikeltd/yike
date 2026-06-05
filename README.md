# Yike.ng

The fastest and safest way to find real houses in Nigeria.

Mobile-first housing marketplace MVP — browse listings, contact agents on WhatsApp, and moderate listings through a simple admin panel.

## Brand (locked)

| Token | Hex | Use |
|-------|-----|-----|
| Navy | `#031B4E` | Nav, dark foundation, trust |
| Gold | `#E4B547` | CTAs, badges, verified, highlights |

Logo: `public/images/logo.webp` (transparent). Regenerate assets: `npm run optimize:brand`

Product direction is locked in `.cursor/rules/yike-product-direction.mdc` — do not deviate unless the founder says so.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS
- **Supabase** — Auth, Postgres, Storage
- **Vercel** — deployment target
- **PWA-ready** — `manifest.json` + mobile viewport

## Features (MVP)

- Public property browse, search & filters
- Property detail with gallery, agent card, WhatsApp/call
- Agent signup, listing upload (pending → admin approve)
- Admin moderation (listings, agents, reports, featured)
- Verified badge for verified agents
- Report listing (auto-hide after 3 open reports)
- Saved listings (authenticated users)
- Featured listings ranking

**Not in MVP:** escrow, payments, in-app chat, AI, native apps.

## Quick start

### 1. Install

```bash
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migration in `supabase/migrations/20250604000000_initial_schema.sql` via SQL Editor or CLI:

```bash
npx supabase link --project-ref YOUR_REF
npx supabase db push
```

3. Create Storage bucket `property-media` (public read). All agent uploads go through `POST /api/media/upload` — auto WebP + thumb/medium/large sizes.
4. Copy `.env.example` → `.env.local` and add your URL + anon key.

### 3. First admin user

After signing up, promote your profile in SQL:

```sql
UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_USER_UUID';
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push to GitHub.
2. Import project on [vercel.com](https://vercel.com).
3. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Point domain **yike.ng** in Vercel DNS.

## Routes

| Public | Agent | Admin |
|--------|-------|-------|
| `/` | `/agent` | `/admin` |
| `/search` | `/agent/listings` | `/admin/listings` |
| `/properties/[id]` | `/agent/listings/new` | `/admin/agents` |
| `/agents/[id]` | `/agent/verification` | `/admin/reports` |
| `/saved` | | `/admin/featured` |
| `/post-property` | | |
| `/verify-agent` | | |

## Brand

- Domain: [yike.ng](https://yike.ng)
- Social: [@real_yike](https://x.com/real_yike) · [facebook.com/realyike](https://facebook.com/realyike)

## License

Private — Yike.ng
