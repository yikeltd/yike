import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, SellerVerification } from "@/types/database";
import { logPaymentAudit } from "@/lib/payments/audit";
import {
  isBasicSellerVerified,
  resolveSellerVerificationLevel,
  type SellerVerificationDocuments,
  validateBusinessVerificationDocuments,
} from "@/lib/seller-verification/levels";
import { getRevenuePrice } from "@/lib/revenue-pricing/service";

export type SellerVerificationActionResult =
  | { ok: true; verification: SellerVerification }
  | { ok: false; error: string; code?: string };

export async function syncSellerVerificationLevel(
  admin: SupabaseClient,
  userId: string
): Promise<void> {
  const { data: profile } = await admin
    .from("profiles")
    .select(
      "id, email_verified, whatsapp, phone, whatsapp_verified_at, whatsapp_verification_status, account_type, company_name, cac_number, full_name, date_of_birth, residential_address, office_address, residential_city, residential_state, seller_verification_level"
    )
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return;

  const row = profile as Partial<Profile> & { id: string; seller_verification_level?: string | null };
  if (row.seller_verification_level === "business") return;

  const next = resolveSellerVerificationLevel(row);
  if (next === row.seller_verification_level) return;

  await admin
    .from("profiles")
    .update({
      seller_verification_level: next,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

export async function getLatestSellerVerification(
  admin: SupabaseClient,
  userId: string
): Promise<SellerVerification | null> {
  const { data } = await admin
    .from("seller_verifications")
    .select("*")
    .eq("user_id", userId)
    .eq("verification_level", "business")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as SellerVerification | null) ?? null;
}

export async function hasBlockingBusinessVerification(
  admin: SupabaseClient,
  userId: string
): Promise<boolean> {
  const latest = await getLatestSellerVerification(admin, userId);
  if (!latest) return false;
  return ["pending", "under_review", "approved"].includes(latest.status);
}

export async function createBusinessVerificationFromPayment(
  admin: SupabaseClient,
  input: {
    userId: string;
    paymentOrderId: string;
    documents: SellerVerificationDocuments;
  }
): Promise<SellerVerificationActionResult> {
  const existing = await getLatestSellerVerification(admin, input.userId);
  if (existing?.status === "approved") {
    return { ok: false, error: "Business verification already approved.", code: "already_approved" };
  }
  if (existing && ["pending", "under_review"].includes(existing.status)) {
    return { ok: true, verification: existing };
  }

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("seller_verifications")
    .insert({
      user_id: input.userId,
      verification_level: "business",
      status: "pending",
      documents: input.documents,
      payment_order_id: input.paymentOrderId || null,
      submitted_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create verification request" };
  }

  const auditAmount = await getRevenuePrice(admin, "verification_fee", "standard");
  logPaymentAudit({
    action: "verification_request_created",
    actorId: input.userId,
    targetId: data.id as string,
    targetUserId: input.userId,
    metadata: {
      amount: auditAmount,
      payment_order_id: input.paymentOrderId || null,
    },
  });

  return { ok: true, verification: data as SellerVerification };
}

export async function approveSellerVerification(
  admin: SupabaseClient,
  verificationId: string,
  reviewerId: string
): Promise<SellerVerificationActionResult> {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("seller_verifications")
    .update({
      status: "approved",
      reviewed_by: reviewerId,
      reviewed_at: now,
      updated_at: now,
    })
    .eq("id", verificationId)
    .in("status", ["pending", "under_review"])
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not approve request" };
  }

  const verification = data as SellerVerification;
  await admin
    .from("profiles")
    .update({
      seller_verification_level: "business",
      updated_at: now,
    })
    .eq("id", verification.user_id);

  logPaymentAudit({
    action: "verification_approved",
    actorId: reviewerId,
    targetId: verification.id,
    targetUserId: verification.user_id,
    metadata: { seller_verification_approved: true },
  });

  return { ok: true, verification };
}

export async function rejectSellerVerification(
  admin: SupabaseClient,
  verificationId: string,
  reviewerId: string,
  reviewNotes: string
): Promise<SellerVerificationActionResult> {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("seller_verifications")
    .update({
      status: "rejected",
      review_notes: reviewNotes.trim() || "Verification not approved.",
      reviewed_by: reviewerId,
      reviewed_at: now,
      updated_at: now,
    })
    .eq("id", verificationId)
    .in("status", ["pending", "under_review"])
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not reject request" };
  }

  return { ok: true, verification: data as SellerVerification };
}

export async function requestMoreSellerVerificationInfo(
  admin: SupabaseClient,
  verificationId: string,
  reviewerId: string,
  reviewNotes: string
): Promise<SellerVerificationActionResult> {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("seller_verifications")
    .update({
      status: "pending",
      review_notes: reviewNotes.trim() || "Additional information required.",
      reviewed_by: reviewerId,
      reviewed_at: now,
      updated_at: now,
    })
    .eq("id", verificationId)
    .in("status", ["pending", "under_review"])
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not update request" };
  }

  return { ok: true, verification: data as SellerVerification };
}

export async function markSellerVerificationUnderReview(
  admin: SupabaseClient,
  verificationId: string,
  reviewerId: string
): Promise<SellerVerificationActionResult> {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("seller_verifications")
    .update({
      status: "under_review",
      reviewed_by: reviewerId,
      updated_at: now,
    })
    .eq("id", verificationId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not update request" };
  }

  return { ok: true, verification: data as SellerVerification };
}

export function validateCheckoutDocuments(
  profile: Profile,
  documents: SellerVerificationDocuments
): string | null {
  if (!isBasicSellerVerified(profile)) {
    return "Complete email, WhatsApp, and profile setup before applying.";
  }
  return validateBusinessVerificationDocuments(profile, documents);
}
