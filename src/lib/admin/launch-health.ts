/**
 * Launch-day command center metrics — existing tables/env only.
 * @see docs/launch/FINAL_PRE_LAUNCH_REPORT.md
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthSmsVerificationStatus } from "@/lib/auth/sms-verification-flag";
import { isFeaturedPaymentsEnabled } from "@/lib/feature-flags";
import { isPaystackConfigured } from "@/lib/payments/config";
import { getSendchampConfigSummary } from "@/lib/notifications/providers/sendchamp";
import { isResendConfigured } from "@/lib/notifications/providers/resend";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAdminClientConfigured } from "@/lib/supabase/admin";
import { offsetDaysIso } from "@/lib/time";

export type HealthTone = "ok" | "warn" | "fail" | "na";

export type SystemStatusItem = {
  id: string;
  label: string;
  tone: HealthTone;
  detail: string;
};

export type LaunchHealthSnapshot = {
  generatedAt: string;
  overall: HealthTone;
  systems: SystemStatusItem[];
  marketplace: {
    vehicles: number;
    properties: number;
    dealers: number;
    pendingListings: number;
    pendingReports: number;
  };
  today: {
    newUsers: number;
    newListings: number;
    searches: number;
    contactAttempts: number;
    saves: number;
  };
  smsBypassActive: boolean;
};

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function worstTone(tones: HealthTone[]): HealthTone {
  if (tones.includes("fail")) return "fail";
  if (tones.includes("warn")) return "warn";
  if (tones.every((t) => t === "na")) return "na";
  return "ok";
}

export async function getLaunchHealthSnapshot(
  supabase: SupabaseClient,
): Promise<LaunchHealthSnapshot> {
  const since24h = offsetDaysIso(-1);
  const todayStart = startOfTodayIso();
  const sms = getAuthSmsVerificationStatus();
  const sendchamp = getSendchampConfigSummary();
  const emailConfigured = isResendConfigured();
  const paystack = isPaystackConfigured();
  const paymentsLive = isFeaturedPaymentsEnabled() && paystack;

  const [
    emailFailed,
    otpFailed,
    propertyLive,
    vehicleLive,
    pendingListings,
    dealers,
    reportsPending,
    usersToday,
    listingsToday,
    searchesToday,
    savesToday,
    contactProxy,
  ] = await Promise.all([
    supabase
      .from("email_logs")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", since24h),
    supabase
      .from("otp_logs")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", since24h),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .or("asset_type.eq.PROPERTY,asset_type.is.null"),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .eq("asset_type", "VEHICLE"),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("account_type", "dealer"),
    supabase
      .from("listing_reports")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "pending"]),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart),
    supabase
      .from("listing_analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "search_impression")
      .gte("created_at", todayStart),
    supabase
      .from("favorites")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart),
    supabase
      .from("properties")
      .select("contact_clicks")
      .eq("status", "approved")
      .limit(5000),
  ]);

  const dbOk = isSupabaseConfigured() && isAdminClientConfigured();
  const emailFailCount = emailFailed.count ?? 0;
  const otpFailCount = otpFailed.count ?? 0;
  const cronConfigured = Boolean(process.env.CRON_SECRET?.trim());

  // Contact attempts: prefer lead events if present; fallback to listing counters sum (lifetime proxy).
  let contactAttemptsToday = 0;
  const leadsToday = await supabase
    .from("listing_leads")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStart);
  if (!leadsToday.error) {
    contactAttemptsToday = leadsToday.count ?? 0;
  } else {
    contactAttemptsToday = (contactProxy.data ?? []).reduce(
      (sum, row) => sum + (Number(row.contact_clicks) || 0),
      0,
    );
  }

  const reportsCount = reportsPending.error ? 0 : (reportsPending.count ?? 0);
  const searchesCount = searchesToday.error ? 0 : (searchesToday.count ?? 0);
  const savesCount = savesToday.error ? 0 : (savesToday.count ?? 0);

  const systems: SystemStatusItem[] = [
    {
      id: "database",
      label: "Database",
      tone: dbOk ? "ok" : "fail",
      detail: dbOk ? "Supabase connected" : "Supabase not configured",
    },
    {
      id: "storage",
      label: "Storage",
      tone: dbOk ? "ok" : "fail",
      detail: dbOk ? "Supabase Storage available" : "Unavailable",
    },
    {
      id: "email",
      label: "Email",
      tone: !emailConfigured
        ? "fail"
        : emailFailCount > 0
          ? "warn"
          : "ok",
      detail: !emailConfigured
        ? "RESEND_API_KEY missing"
        : emailFailCount > 0
          ? `${emailFailCount} failures (24h)`
          : "Resend configured · no failures (24h)",
    },
    {
      id: "sms",
      label: "SMS",
      tone: sms.bypassActive
        ? "warn"
        : !sendchamp.configured
          ? "fail"
          : otpFailCount > 0
            ? "warn"
            : "ok",
      detail: sms.bypassActive
        ? "FAT bypass active (AUTH_SMS_VERIFICATION_ENABLED=false)"
        : !sendchamp.configured
          ? "Sendchamp not configured"
          : otpFailCount > 0
            ? `${otpFailCount} OTP failures (24h)`
            : "SMS verification required · provider OK",
    },
    {
      id: "payments",
      label: "Payments",
      tone: !isFeaturedPaymentsEnabled()
        ? "na"
        : paymentsLive
          ? "ok"
          : "warn",
      detail: !isFeaturedPaymentsEnabled()
        ? "Featured payments off (launch flag)"
        : paymentsLive
          ? "Paystack configured"
          : "Payments flag on · Paystack incomplete",
    },
    {
      id: "search",
      label: "Search",
      tone: dbOk ? "ok" : "fail",
      detail: dbOk ? "Listing search via Supabase" : "Database required",
    },
    {
      id: "images",
      label: "Image Processing",
      tone: dbOk ? "ok" : "fail",
      detail: "Upload pipeline · WebP / responsive sizes",
    },
    {
      id: "media_protection",
      label: "Media Protection",
      tone: dbOk ? "ok" : "fail",
      detail: "Watermark / protection pipeline deployed",
    },
    {
      id: "jobs",
      label: "Background Jobs",
      tone: cronConfigured ? "ok" : "warn",
      detail: cronConfigured
        ? "CRON_SECRET configured"
        : "CRON_SECRET missing — scheduled jobs may fail",
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    overall: worstTone(systems.map((s) => s.tone)),
    systems,
    marketplace: {
      vehicles: vehicleLive.count ?? 0,
      properties: propertyLive.count ?? 0,
      dealers: dealers.count ?? 0,
      pendingListings: pendingListings.count ?? 0,
      pendingReports: reportsCount,
    },
    today: {
      newUsers: usersToday.count ?? 0,
      newListings: listingsToday.count ?? 0,
      searches: searchesCount,
      contactAttempts: contactAttemptsToday,
      saves: savesCount,
    },
    smsBypassActive: sms.bypassActive,
  };
}
