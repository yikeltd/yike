import { NextResponse } from "next/server";
import { getCachedPublicRevenueCatalog } from "@/lib/revenue-pricing/service";

export const runtime = "nodejs";

export async function GET() {
  const catalog = await getCachedPublicRevenueCatalog();
  return NextResponse.json(
    { catalog },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    }
  );
}
