import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UNVERIFIED_AGENT_LISTING_LIMIT } from "@/lib/agent-tiers";
import { isPhoneVerificationRequired } from "@/lib/feature-flags";
import { isEmailVerified } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role, phone_verified, email_verified, is_banned")
    .eq("id", user.id)
    .single();

  if (!profile || profile.is_banned) {
    return NextResponse.json({ error: "Account unavailable" }, { status: 403 });
  }

  if (
    profile.role === "agent_unverified" ||
    profile.role === "agent_verified" ||
    profile.role === "admin" ||
    profile.role === "super_admin"
  ) {
    return NextResponse.json({ ok: true, alreadyAgent: true });
  }

  if (isPhoneVerificationRequired() && !profile.phone_verified) {
    return NextResponse.json(
      { error: "Verify your phone number first" },
      { status: 400 }
    );
  }

  if (!isEmailVerified(user, { email_verified: profile.email_verified })) {
    return NextResponse.json(
      { error: "Verify your email first" },
      { status: 400 }
    );
  }

  const { error } = await admin
    .from("profiles")
    .update({
      role: "agent_unverified",
      listing_limit: UNVERIFIED_AGENT_LISTING_LIMIT,
      verified_badge: false,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Could not upgrade account" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    role: "agent_unverified",
    listingLimit: UNVERIFIED_AGENT_LISTING_LIMIT,
  });
}
