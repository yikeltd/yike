/**
 * Creates or updates Yike founder admin: yikeltd@gmail.com
 * Run: set -a && source .env.local && set +a
 *      ADMIN_PASSWORD='…' node scripts/ensure-admin-user.mjs
 *
 * Optional: YIKE_CREDENTIALS_FILE=path — write TEMPORARY password once (mode 600).
 * Optional: ADMIN_FORCE_PASSWORD_RESET=0 — skip forced reset at /lex/auth/staff/set-password
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, chmodSync } from "node:fs";

const CANONICAL_REF = "hlpojfurfldvcxfxhveg";
const EMAIL = "yikeltd@gmail.com";
const LEGACY_ADMIN_EMAIL = "admin@yike.ng";
const STAFF_ROLES = new Set([
  "super_admin",
  "admin",
  "support",
  "tech",
  "content",
  "careers",
  "moderator",
]);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.ADMIN_PASSWORD?.trim();
const forcePasswordReset = process.env.ADMIN_FORCE_PASSWORD_RESET !== "0";
const credentialsFile = process.env.YIKE_CREDENTIALS_FILE?.trim();

if (!url || !serviceKey) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!password) {
  console.error("Refusing to run: set ADMIN_PASSWORD to a strong temporary secret.");
  process.exit(1);
}

function refFromUrl(s) {
  const m = String(s).match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return m?.[1]?.toLowerCase() ?? null;
}

const ref = refFromUrl(url);
if (ref !== CANONICAL_REF) {
  console.error(`Refusing: Supabase ref ${ref ?? "(invalid)"} !== ${CANONICAL_REF}`);
  process.exit(1);
}

function writeCredentialsBlock(label, lines) {
  if (!credentialsFile) return;
  const block = [
    `# ${label} — TEMPORARY — delete after first login`,
    `# Generated: ${new Date().toISOString()}`,
    ...lines,
    "",
  ].join("\n");
  writeFileSync(credentialsFile, block, { flag: "a" });
  chmodSync(credentialsFile, 0o600);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  let user = list?.users?.find((u) => u.email?.toLowerCase() === EMAIL);
  let existingProfileRole = null;
  let existingStaffRole = null;

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

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (existingProfile?.role && STAFF_ROLES.has(existingProfile.role)) {
    existingProfileRole = existingProfile.role;
  }

  const { data: existingStaff } = await admin
    .from("staff_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (existingStaff?.role && STAFF_ROLES.has(existingStaff.role)) {
    existingStaffRole = existingStaff.role;
  }

  const profileRole = existingProfileRole ?? "super_admin";
  const staffRole = existingStaffRole ?? profileRole;

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: user.id,
      full_name: existingProfile?.full_name ?? "Yike Admin",
      email: EMAIL,
      role: profileRole,
      verification_status: "approved",
      is_banned: false,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    const { error: updateError } = await admin
      .from("profiles")
      .update({
        role: profileRole,
        email: EMAIL,
        verification_status: "approved",
        is_banned: false,
      })
      .eq("id", user.id);
    if (updateError) {
      console.warn("Profile update warning:", updateError.message);
    }
  }

  const staffPayload = {
    id: user.id,
    full_name: existingProfile?.full_name ?? "Yike Admin",
    email: EMAIL,
    work_email: EMAIL,
    role: staffRole,
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

  writeCredentialsBlock("Staff admin (founder)", [
    `login_url=http://127.0.0.1:3000/lex`,
    `email=${EMAIL}`,
    `temporary_password=${password}`,
    `profile_role=${profileRole}`,
    `staff_role=${staffRole}`,
    `password_reset_required=${forcePasswordReset ? "yes" : "no"}`,
  ]);

  console.log("\nAdmin ready:");
  console.log("  URL:", `${process.env.SITE_URL || "http://127.0.0.1:3000"}/lex`);
  console.log("  Email:", EMAIL);
  console.log("  Profile role:", profileRole);
  if (credentialsFile) {
    console.log("  TEMPORARY password written once to:", credentialsFile);
  } else {
    console.error("Set YIKE_CREDENTIALS_FILE to record the TEMPORARY password locally.");
    process.exit(1);
  }
  console.log(
    "  Password reset required:",
    forcePasswordReset ? "yes — use /lex/auth/staff/set-password after login" : "no"
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
