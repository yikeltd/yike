/**
 * Creates or updates Yike admin: yikeltd@gmail.com
 * Run: SUPABASE_SERVICE_ROLE_KEY=... node scripts/ensure-admin-user.mjs
 * Optional: ADMIN_PASSWORD=... (default generated below)
 *
 * Also ensures staff_profiles + require_password_reset so /lex can
 * force a password change on next login.
 */
import { createClient } from "@supabase/supabase-js";

const EMAIL = "yikeltd@gmail.com";
const DEFAULT_PASSWORD = "Yk#Lex9mPvQ2xRn7";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
const forcePasswordReset = process.env.ADMIN_FORCE_PASSWORD_RESET !== "0";

if (!url || !serviceKey) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const LEGACY_ADMIN_EMAIL = "admin@yike.ng";

async function main() {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  let user = list?.users?.find((u) => u.email?.toLowerCase() === EMAIL);

  if (!user) {
    const legacy = list?.users?.find(
      (u) => u.email?.toLowerCase() === LEGACY_ADMIN_EMAIL
    );
    if (legacy) {
      const { data, error } = await admin.auth.admin.updateUserById(legacy.id, {
        email: EMAIL,
        password,
        email_confirm: true,
      });
      if (error) throw error;
      user = data.user;
      console.log("Migrated legacy admin to:", EMAIL);
    }
  }

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: EMAIL,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Yike Admin" },
    });
    if (error) throw error;
    user = data.user;
    console.log("Created auth user:", user.id);
  } else {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      email: EMAIL,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    console.log("Updated admin auth for:", user.id);
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: user.id,
      full_name: "Yike Admin",
      email: EMAIL,
      role: "super_admin",
      verification_status: "approved",
      is_banned: false,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    const { error: updateError } = await admin
      .from("profiles")
      .update({
        role: "super_admin",
        email: EMAIL,
        verification_status: "approved",
        is_banned: false,
        full_name: "Yike Admin",
      })
      .eq("id", user.id);
    if (updateError) {
      console.warn("Profile update warning:", updateError.message);
    }
  }

  const staffPayload = {
    id: user.id,
    full_name: "Yike Admin",
    email: EMAIL,
    work_email: EMAIL,
    role: "super_admin",
    status: "active",
    require_password_reset: forcePasswordReset,
    password_reset_completed_at: forcePasswordReset ? null : new Date().toISOString(),
    onboarding_checklist: {},
    access_checklist: {},
    hr_metadata: {},
    archived_at: null,
    disabled_at: null,
  };

  const { error: staffError } = await admin.from("staff_profiles").upsert(staffPayload, {
    onConflict: "id",
  });
  if (staffError) throw staffError;

  console.log("\nAdmin ready:");
  console.log("  URL:", `${process.env.SITE_URL || "https://yike.ng"}/lex`);
  console.log("  Email:", EMAIL);
  console.log("  Password:", password);
  console.log(
    "  Password reset required:",
    forcePasswordReset ? "yes (set a new password after login)" : "no"
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
