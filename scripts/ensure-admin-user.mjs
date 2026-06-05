/**
 * Creates or updates Yike admin: yikeltd@gmail.com
 * Run: SUPABASE_SERVICE_ROLE_KEY=... node scripts/ensure-admin-user.mjs
 * Optional: ADMIN_PASSWORD=... (default generated below)
 */
import { createClient } from "@supabase/supabase-js";

const EMAIL = "yikeltd@gmail.com";
const DEFAULT_PASSWORD = "Yk#Lex9mPvQ2xRn7";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;

if (!url || !serviceKey) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  let user = list?.users?.find((u) => u.email?.toLowerCase() === EMAIL);

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
      password,
      email_confirm: true,
    });
    if (error) throw error;
    console.log("Updated password for:", user.id);
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: user.id,
      full_name: "Yike Admin",
      email: EMAIL,
      role: "admin",
      verification_status: "approved",
      is_banned: false,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    const { error: updateError } = await admin
      .from("profiles")
      .update({ role: "admin", email: EMAIL, verification_status: "approved" })
      .eq("id", user.id);
    if (updateError) throw updateError;
  }

  console.log("\nAdmin ready:");
  console.log("  URL:", `${process.env.SITE_URL || "https://yike.ng"}/lex/auth`);
  console.log("  Email:", EMAIL);
  console.log("  Password:", password);
  console.log("\nChange password anytime in Supabase Auth or after sign-in.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
