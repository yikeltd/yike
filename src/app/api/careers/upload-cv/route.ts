import { NextResponse } from "next/server";
import { createAdminClient, createVerifiedAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function POST(request: Request) {
  const admin = (await createVerifiedAdminClient()) ?? createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const form = await request.formData();
  const file = form.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Upload PDF or Word document only" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage.from("career-cvs").upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error("[careers/upload-cv] upload failed:", error.message);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const { data: signed } = await admin.storage
    .from("career-cvs")
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  return NextResponse.json({
    ok: true,
    path,
    url: signed?.signedUrl ?? null,
  });
}
