/**
 * Google Play reviewer accounts — password login, no phone OTP required.
 * Run: SUPABASE_SERVICE_ROLE_KEY=... node scripts/ensure-reviewer-users.mjs
 * Optional: REVIEWER_PASSWORD=... (default below)
 */
import { createClient } from "@supabase/supabase-js";

const REVIEWERS = [
  { email: "reviewer@yike.ng", fullName: "Play Store Reviewer" },
  { email: "adminreview@yike.ng", fullName: "Play Store Admin Reviewer" },
];

const DEFAULT_PASSWORD = process.env.REVIEWER_PASSWORD || "YikeReview2026!";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureReviewer({ email, fullName }) {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  let user = list?.users?.find((u) => u.email?.toLowerCase() === email);

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) throw error;
    user = data.user;
    console.log("Created:", email);
  } else {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password: DEFAULT_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    console.log("Updated:", email);
  }

  const username = email.split("@")[0].replace(/\./g, "_");
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: user.id,
      full_name: fullName,
      username,
      email,
      phone: "08000000001",
      phone_verified: true,
      email_verified: true,
      role: "user",
      verification_status: "not_started",
      is_banned: false,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    await admin
      .from("profiles")
      .update({
        full_name: fullName,
        username,
        email,
        phone_verified: true,
        email_verified: true,
        is_banned: false,
      })
      .eq("id", user.id);
  }
}

async function main() {
  for (const reviewer of REVIEWERS) {
    await ensureReviewer(reviewer);
  }
  console.log("\nReviewer accounts ready (sign in at /auth/login — no phone OTP):");
  for (const { email } of REVIEWERS) {
    console.log(`  ${email} / ${DEFAULT_PASSWORD}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
