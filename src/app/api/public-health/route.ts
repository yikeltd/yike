import { NextResponse } from "next/server";
import { buildStandardHealthPayload } from "@/lib/deploy-metadata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    buildStandardHealthPayload({
      application: "yike",
      status: "ok",
      database: "skipped",
    }),
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
