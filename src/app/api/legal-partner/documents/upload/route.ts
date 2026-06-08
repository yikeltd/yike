import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WEBP_CONTENT_TYPE } from "@/lib/media/constants";
import { optimizeImagePreset, resolveImageMime } from "@/lib/media/image";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const form = await request.formData();
  const file = form.get("file") as File | null;
  const requestId = String(form.get("requestId") ?? "").trim();
  const label = String(form.get("label") ?? "document").trim().slice(0, 80);

  if (!file || !requestId) {
    return NextResponse.json({ error: "File and requestId required" }, { status: 400 });
  }

  const isPdf = file.type === "application/pdf";
  const imageMime = resolveImageMime(file);
  if (!isPdf && !imageMime) {
    return NextResponse.json({ error: "PDF or image files only" }, { status: 400 });
  }

  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 15MB)" }, { status: 400 });
  }

  const { data: reqRow } = await admin
    .from("legal_verification_requests")
    .select("id, requester_user_id, assigned_legal_partner_id, uploaded_documents")
    .eq("id", requestId)
    .single();

  if (!reqRow) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  const { data: partner } = await admin
    .from("legal_partners")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  const isRequester = reqRow.requester_user_id === user.id;
  const isPartner = partner?.id === reqRow.assigned_legal_partner_id;
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isStaff = profile?.role === "admin" || profile?.role === "super_admin";

  if (!isRequester && !isPartner && !isStaff) {
    return NextResponse.json({ error: "Not authorized for this request" }, { status: 403 });
  }

  const safeLabel = label.replace(/[^a-z0-9-_]/gi, "_");
  const buffer = Buffer.from(await file.arrayBuffer());

  let uploadBody: Buffer;
  let path: string;
  let storedMime: string;

  if (isPdf) {
    uploadBody = buffer;
    path = `${requestId}/${Date.now()}-${safeLabel}.pdf`;
    storedMime = "application/pdf";
  } else {
    try {
      const processed = await optimizeImagePreset(buffer, "card");
      uploadBody = processed.buffer;
      path = `${requestId}/${Date.now()}-${safeLabel}.webp`;
      storedMime = WEBP_CONTENT_TYPE;
    } catch {
      return NextResponse.json({ error: "Could not process image" }, { status: 400 });
    }
  }

  const { error: uploadError } = await admin.storage
    .from("legal-verification-docs")
    .upload(path, uploadBody, { contentType: storedMime, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const entry = {
    path,
    label,
    mime: storedMime,
    uploadedBy: user.id,
    uploadedAt: new Date().toISOString(),
  };

  const existing = Array.isArray(reqRow.uploaded_documents) ? reqRow.uploaded_documents : [];
  await admin
    .from("legal_verification_requests")
    .update({
      uploaded_documents: [...existing, entry],
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  return NextResponse.json({ ok: true, document: entry });
}
