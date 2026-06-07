import { NextResponse } from "next/server";
import { NIGERIAN_COMMERCIAL_BANKS } from "@/lib/ambassador/nigerian-banks";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ banks: NIGERIAN_COMMERCIAL_BANKS });
}
