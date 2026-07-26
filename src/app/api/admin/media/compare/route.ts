import { NextResponse } from "next/server";
import { requireTechApi } from "@/lib/admin/api-auth";
import { compareFingerprints } from "@/lib/media/protection";

export const runtime = "nodejs";

/** Staff-only: compare fingerprint bundles (foundation for duplicate detection). */
export async function POST(request: Request) {
  const auth = await requireTechApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as {
    left?: {
      sha256?: string;
      ahash?: string;
      dhash?: string;
      phash?: string;
    };
    right?: {
      sha256?: string;
      ahash?: string;
      dhash?: string;
      phash?: string;
    };
  } | null;

  if (!body?.left || !body?.right) {
    return NextResponse.json({ error: "left and right fingerprint objects required" }, { status: 400 });
  }

  return NextResponse.json({
    comparison: compareFingerprints(body.left, body.right),
  });
}
