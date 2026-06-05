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

**GitHub:** [yikeltd/yike](https://github.com/yikeltd/yike) · **Vercel:** [yikeprojects/yike](https://vercel.com/yikeprojects/yike) · **Production:** [yike.ng](https://yike.ng)

Push to `main` → Vercel production deploys automatically (Git integration). Other branches and PRs get preview URLs.

### Environment variables (Vercel → yike → Settings → Environment Variables)

| Key | Scope |
|-----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Development (secret) |
| `SENDCHAMP_API_KEY` | Production, Preview (secret) |
| `RESEND_API_KEY` | Production, Preview (secret) |

See `.env.example` for all keys. Supabase: [API settings](https://supabase.com/dashboard/project/gyxemepnrkwxocgzfbeo/settings/api).

### Local deploy (optional)

```bash
vercel link    # team: yike-ng, project: yike
vercel deploy --prod
```

## Routes

| Public | Agent | Admin |
|--------|-------|-------|
| `/` | `/agent` | `/lex/auth` |
| `/search` | `/agent/listings` | `/lex/auth/listings` |
| `/properties/[id]` | `/agent/listings/new` | `/lex/auth/agents` |
| `/agents/[id]` | `/agent/verification` | `/lex/auth/reports` |
| `/saved` | | `/lex/auth/featured` |
| `/post-property` | | |
| `/verify-agent` | | |

## Brand

- Domain: [yike.ng](https://yike.ng)
- Social: [@real_yike](https://x.com/real_yike) · [facebook.com/realyike](https://facebook.com/realyike)

## License

Private — Yike.ng
