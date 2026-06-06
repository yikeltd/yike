/**
 * Seed Yike Supabase with nationwide demo listings.
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-supabase.ts
 * Or generate SQL only:
 *   npx tsx scripts/seed-supabase.ts --sql > /tmp/yike-seed.sql
 */

import { createClient } from "@supabase/supabase-js";
import { buildMockListings } from "../src/lib/mock-listings-seed";
import type { Property } from "../src/types/database";

const AGENT_UUIDS: Record<string, string> = {
  "ag-1": "00000000-0000-4000-8000-000000000011",
  "ag-2": "00000000-0000-4000-8000-000000000012",
  "ag-3": "00000000-0000-4000-8000-000000000013",
  "ag-4": "00000000-0000-4000-8000-000000000014",
  "ag-5": "00000000-0000-4000-8000-000000000015",
  "ag-6": "00000000-0000-4000-8000-000000000016",
  "ag-7": "00000000-0000-4000-8000-000000000017",
  "ag-8": "00000000-0000-4000-8000-000000000018",
  "ag-9": "00000000-0000-4000-8000-000000000019",
  "ag-10": "00000000-0000-4000-8000-00000000001a",
  "ag-11": "00000000-0000-4000-8000-00000000001b",
  "ag-12": "00000000-0000-4000-8000-00000000001c",
};

const ADMIN_UUID = "00000000-0000-4000-8000-000000000001";

function propertyUuid(demoId: string): string {
  const n = Number(demoId.replace("demo-", ""));
  return `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

function sqlEscape(value: string): string {
  return value.replace(/'/g, "''");
}

function toSqlArray(urls: string[]): string {
  if (urls.length === 0) return "ARRAY[]::text[]";
  return `ARRAY[${urls.map((u) => `'${sqlEscape(u)}'`).join(", ")}]::text[]`;
}

function generateSql(listings: Property[]): string {
  const agents = new Map<string, NonNullable<Property["agent"]>>();
  for (const p of listings) {
    if (p.agent) agents.set(p.agent.id, p.agent);
  }

  const lines: string[] = [
    "-- Yike seed data",
    "CREATE EXTENSION IF NOT EXISTS pgcrypto;",
    "",
  ];

  const seedUsers = [
    {
      id: ADMIN_UUID,
      email: "yikeltd@gmail.com",
      meta: { full_name: "Yike Admin", phone: "08000000000", role: "admin" },
    },
    ...[...agents.values()].map((a) => ({
      id: AGENT_UUIDS[a.id] ?? a.id,
      email: `${a.id}@yike.seed`,
      meta: {
        full_name: a.full_name,
        phone: a.phone,
        role: "agent",
      },
    })),
  ];

  for (const user of seedUsers) {
    const meta = JSON.stringify(user.meta);
    lines.push(`
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_super_admin, confirmation_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '${user.id}'::uuid,
  'authenticated', 'authenticated',
  '${user.email}',
  extensions.crypt('YikeSeed2026!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '${meta}'::jsonb,
  now(), now(), false, ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES (
  '${user.id}'::uuid,
  '${user.id}'::uuid,
  jsonb_build_object('sub', '${user.id}', 'email', '${user.email}'),
  'email', '${user.email}', now(), now(), now()
) ON CONFLICT (provider, provider_id) DO NOTHING;
`);
  }

  lines.push(`
-- GoTrue requires empty strings, not NULL, on token/email_change columns
UPDATE auth.users SET
  email_change = COALESCE(email_change, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change_token = COALESCE(phone_change_token, '')
WHERE email_change IS NULL
   OR recovery_token IS NULL
   OR email_change_token_new IS NULL
   OR reauthentication_token IS NULL
   OR confirmation_token IS NULL
   OR email_change_token_current IS NULL
   OR phone_change_token IS NULL;
`);

  for (const agent of agents.values()) {
    const id = AGENT_UUIDS[agent.id];
    if (!id) continue;
    lines.push(`
UPDATE profiles SET
  full_name = '${sqlEscape(agent.full_name ?? "Agent")}',
  phone = '${sqlEscape(agent.phone ?? "")}',
  whatsapp = '${sqlEscape(agent.whatsapp ?? agent.phone ?? "")}',
  role = 'agent',
  verification_status = '${agent.verification_status}',
  agent_type = '${agent.agent_type ?? "independent"}',
  trust_score = ${agent.trust_score}
WHERE id = '${id}'::uuid;
`);
  }

  lines.push(`
UPDATE profiles SET
  full_name = 'Yike Admin',
  email = 'yikeltd@gmail.com',
  phone = '08000000000',
  role = 'admin',
  verification_status = 'verified',
  trust_score = 100
WHERE id = '${ADMIN_UUID}'::uuid;
`);

  for (const p of listings) {
    const agentId = AGENT_UUIDS[p.agent_id];
    if (!agentId) continue;
    const id = propertyUuid(p.id);
    const extras = JSON.stringify(p.extras ?? {});
    lines.push(`
INSERT INTO properties (
  id, agent_id, title, description, listing_type, property_type,
  bedrooms, bathrooms, toilets, price, payment_period,
  state, city, area, address_hint, landmark, media_urls, video_url,
  status, is_featured, is_verified_listing, views_count, contact_clicks,
  expires_at, created_at, updated_at, extras
) VALUES (
  '${id}'::uuid,
  '${agentId}'::uuid,
  '${sqlEscape(p.title)}',
  ${p.description ? `'${sqlEscape(p.description)}'` : "NULL"},
  '${p.listing_type}',
  ${p.property_type ? `'${p.property_type}'` : "NULL"},
  ${p.bedrooms}, ${p.bathrooms}, ${p.toilets},
  ${p.price}, '${p.payment_period}',
  '${sqlEscape(p.state)}', '${sqlEscape(p.city)}', '${sqlEscape(p.area)}',
  ${p.address_hint ? `'${sqlEscape(p.address_hint)}'` : "NULL"},
  ${p.landmark ? `'${sqlEscape(p.landmark)}'` : "NULL"},
  ${toSqlArray(p.media_urls)},
  ${p.video_url ? `'${sqlEscape(p.video_url)}'` : "NULL"},
  'approved', ${p.is_featured}, ${p.is_verified_listing},
  ${p.views_count}, ${p.contact_clicks},
  '${p.expires_at}'::timestamptz,
  '${p.created_at}'::timestamptz,
  '${p.updated_at}'::timestamptz,
  '${sqlEscape(extras)}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  media_urls = EXCLUDED.media_urls,
  extras = EXCLUDED.extras,
  updated_at = EXCLUDED.updated_at;
`);
  }

  return lines.join("\n");
}

async function seedWithApi(listings: Property[]) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const agents = new Map<string, NonNullable<Property["agent"]>>();
  for (const p of listings) {
    if (p.agent) agents.set(p.agent.id, p.agent);
  }

  await admin.auth.admin.createUser({
    email: "admin@yike.ng",
    password: "YikeSeed2026!",
    email_confirm: true,
    user_metadata: { full_name: "Yike Admin", phone: "08000000000", role: "admin" },
  }).catch(() => {});

  for (const agent of agents.values()) {
    const email = `${agent.id}@yike.seed`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: "YikeSeed2026!",
      email_confirm: true,
      user_metadata: {
        full_name: agent.full_name,
        phone: agent.phone,
        role: "agent",
      },
    });
    if (error && !error.message.includes("already")) {
      console.error(`Agent ${email}:`, error.message);
      continue;
    }
    const userId = data?.user?.id;
    if (!userId) continue;
    await admin.from("profiles").update({
      full_name: agent.full_name,
      phone: agent.phone,
      whatsapp: agent.whatsapp,
      role: "agent",
      verification_status: agent.verification_status,
      agent_type: agent.agent_type,
      trust_score: agent.trust_score,
    }).eq("id", userId);
  }

  const { data: profiles } = await admin.from("profiles").select("id, full_name");
  const profileByName = new Map(
    (profiles ?? []).map((p) => [p.full_name, p.id])
  );

  for (const p of listings) {
    const agentName = p.agent?.full_name;
    const agentId = agentName ? profileByName.get(agentName) : null;
    if (!agentId) continue;

    const row = {
      agent_id: agentId,
      title: p.title,
      description: p.description,
      listing_type: p.listing_type,
      property_type: p.property_type,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      toilets: p.toilets,
      price: p.price,
      payment_period: p.payment_period,
      state: p.state,
      city: p.city,
      area: p.area,
      address_hint: p.address_hint,
      landmark: p.landmark,
      media_urls: p.media_urls,
      video_url: p.video_url,
      status: "approved" as const,
      is_featured: p.is_featured,
      is_verified_listing: p.is_verified_listing,
      views_count: p.views_count,
      contact_clicks: p.contact_clicks,
      expires_at: p.expires_at,
      created_at: p.created_at,
      updated_at: p.updated_at,
      extras: p.extras ?? {},
    };

    const { error } = await admin.from("properties").insert(row);
    if (error) console.error(`Listing ${p.title}:`, error.message);
  }

  console.log(`Seeded ${listings.length} listings`);
}

async function main() {
  const listings = buildMockListings();
  if (process.argv.includes("--sql")) {
    process.stdout.write(generateSql(listings));
    return;
  }
  await seedWithApi(listings);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
