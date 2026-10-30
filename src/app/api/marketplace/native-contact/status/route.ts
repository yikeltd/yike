import { NextResponse } from "next/server";
import { getNativeContactStatus } from "@/lib/marketplace/native-contact-status";

export const runtime = "nodejs";

export async function GET() {
  const status = await getNativeContactStatus();
  return NextResponse.json(status);
}
