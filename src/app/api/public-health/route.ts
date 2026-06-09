import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      app: "yike",
      commit:
        process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ??
        process.env.NEXT_PUBLIC_APP_VERSION ??
        "local",
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
