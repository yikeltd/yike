import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runTrustQualityBatch } from "@/lib/trust/recalculate";
import { archiveDueListings } from "@/lib/trust/listing-staleness";
import { expireStaleVerificationReports } from "@/lib/verification/report-expiry";
import { expireDueFeaturedPromotions } from "@/lib/featured-promotions/service";

export const runtime = "nodejs";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  const cronHeader =
    request.headers.get("x-cron-secret") ??
    request.headers.get("x-vercel-cron-secret");
  return auth === `Bearer ${secret}` || cronHeader === secret;
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: expiredCount, error: expireError } = await admin.rpc(
    "yike_mark_expired_listings"
  );

  const trust = await runTrustQualityBatch(admin);
  const archivedListings = await archiveDueListings(admin);
  const expiredReports = await expireStaleVerificationReports(admin);
  const featuredExpiry = await expireDueFeaturedPromotions(admin);

  if (expireError) {
    return NextResponse.json(
      { error: expireError.message, trust },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    expiredMarked: expiredCount ?? 0,
    archivedListings,
    expiredReports,
    featuredExpiredListings: featuredExpiry.expiredListings,
    featuredExpiredPromotions: featuredExpiry.expiredPromotions,
    ...trust,
  });
}
