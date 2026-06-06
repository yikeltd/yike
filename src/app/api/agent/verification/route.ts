import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSensitive } from "@/lib/encryption";
import { validateNinFormat } from "@/lib/verification/nin-provider";

export const runtime = "nodejs";

const RATE_MS = 5 * 60_000;

type SubmitBody = {
  fullName?: string;
  residentialAddress?: string;
  state?: string;
  city?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  occupation?: string;
  nin?: string;
  selfieUrl?: string;
};

export async function POST(request: Request) {
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

  const body = (await request.json().catch(() => ({}))) as SubmitBody;

  const fullName = String(body.fullName ?? "").trim();
  const residentialAddress = String(body.residentialAddress ?? "").trim();
  const state = String(body.state ?? "").trim();
  const city = String(body.city ?? "").trim();
  const dateOfBirth = String(body.dateOfBirth ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const email = String(body.email ?? user.email ?? "").trim().toLowerCase();
  const occupation = String(body.occupation ?? "").trim();
  const nin = String(body.nin ?? "").replace(/\D/g, "");
  const selfieUrl = String(body.selfieUrl ?? "").trim();

  if (!fullName || !residentialAddress || !state || !city || !dateOfBirth) {
    return NextResponse.json({ error: "Complete all personal details" }, { status: 400 });
  }
  if (!phone || !email) {
    return NextResponse.json({ error: "Phone and email are required" }, { status: 400 });
  }
  if (nin.length !== 11) {
    return NextResponse.json({ error: "Enter a valid 11-digit NIN" }, { status: 400 });
  }
  if (!selfieUrl.startsWith("http")) {
    return NextResponse.json({ error: "Upload a clear selfie" }, { status: 400 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select(
      "role, verification_status, phone_verified, email_verified, full_name, verified_badge"
    )
    .eq("id", user.id)
    .single();

  if (
    profile?.role !== "agent_unverified" &&
    profile?.role !== "agent_verified"
  ) {
    return NextResponse.json(
      { error: "Become an agent before applying for verification" },
      { status: 400 }
    );
  }

  if (!profile?.phone_verified) {
    return NextResponse.json({ error: "Verify your phone first" }, { status: 400 });
  }
  if (!user.email_confirmed_at && !profile.email_verified) {
    return NextResponse.json({ error: "Verify your email first" }, { status: 400 });
  }

  const vStatus = profile.verification_status;
  if (vStatus === "approved" || vStatus === "verified") {
    return NextResponse.json({ error: "Already verified" }, { status: 400 });
  }
  if (vStatus === "pending") {
    return NextResponse.json({ error: "Application already under review" }, { status: 409 });
  }

  const { data: last } = await admin
    .from("agent_verifications")
    .select("submitted_at, status")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (
    last?.submitted_at &&
    Date.now() - new Date(last.submitted_at).getTime() < RATE_MS
  ) {
    return NextResponse.json(
      { error: "Please wait before resubmitting" },
      { status: 429 }
    );
  }

  const ninResult = validateNinFormat(nin);
  if (!ninResult.ok) {
    return NextResponse.json({ error: ninResult.error }, { status: 422 });
  }

  const encryptedNin = encryptSensitive(nin);
  if (!encryptedNin) {
    return NextResponse.json(
      { error: "Server encryption not configured" },
      { status: 503 }
    );
  }

  await admin
    .from("profiles")
    .update({ verification_status: "pending", full_name: fullName })
    .eq("id", user.id);

  const { error } = await admin.from("agent_verifications").insert({
    agent_id: user.id,
    user_id: user.id,
    full_name: fullName,
    residential_address: residentialAddress,
    state,
    city,
    date_of_birth: dateOfBirth,
    phone,
    email,
    occupation: occupation || null,
    nin_number_encrypted: encryptedNin,
    nin_encrypted: encryptedNin,
    selfie_url: selfieUrl,
    nin_provider: "manual_review",
    nin_verified: false,
    provider_reference: null,
    status: "pending",
    submitted_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: "Could not submit application" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Submitted! We review within 1–2 business days.",
  });
}
