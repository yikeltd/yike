import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/admin/audit";
import {
  canAutoApproveSellerProfile,
  runSellerProfileReview,
  type ProfileReviewInput,
  type ProfileReviewResult,
} from "./profile-review-engine";
import { serializeSellerProfileReviewNotes } from "./profile-review-notes";

export type SellerProfileReviewOutcome =
  | { outcome: "auto_approved"; review: ProfileReviewResult }
  | { outcome: "queued"; review: ProfileReviewResult };

async function findDuplicateUserIds(
  admin: SupabaseClient,
  userId: string,
  phone: string | null,
  email: string | null
): Promise<{ phoneIds: string[]; emailIds: string[] }> {
  const phoneIds: string[] = [];
  const emailIds: string[] = [];

  if (phone?.trim()) {
    const p = phone.trim();
    const { data } = await admin
      .from("profiles")
      .select("id")
      .neq("id", userId)
      .or(`phone.eq.${p},whatsapp.eq.${p}`)
      .limit(10);
    for (const row of data ?? []) {
      phoneIds.push(String((row as { id: string }).id));
    }
  }

  if (email?.trim()) {
    const e = email.trim().toLowerCase();
    const { data } = await admin
      .from("profiles")
      .select("id")
      .neq("id", userId)
      .eq("email", e)
      .limit(10);
    for (const row of data ?? []) {
      emailIds.push(String((row as { id: string }).id));
    }
  }

  return { phoneIds, emailIds };
}

async function hasPriorRejection(
  admin: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await admin
    .from("agent_verifications")
    .select("id")
    .eq("agent_id", userId)
    .eq("status", "rejected")
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function applyAutoApproval(
  admin: SupabaseClient,
  userId: string,
  verificationId: string,
  review: ProfileReviewResult,
  evidence: Record<string, unknown>
): Promise<boolean> {
  const now = new Date().toISOString();
  const notes = serializeSellerProfileReviewNotes(review, {
    ...evidence,
    decision: "auto_approved",
  });

  const { data: agentProfile } = await admin
    .from("profiles")
    .select("listing_limit_updated_by, verification_status")
    .eq("id", userId)
    .single();

  const profilePatch: Record<string, unknown> = {
    role: "agent_verified",
    verification_status: "approved",
    verified_badge: true,
    ranking_score: 100,
    verification_required: false,
    verified_at: now,
    verification_notes: null,
  };

  if (!agentProfile?.listing_limit_updated_by) {
    profilePatch.listing_limit = null;
  }

  const { data: updatedProfile, error: profileError } = await admin
    .from("profiles")
    .update(profilePatch)
    .eq("id", userId)
    .eq("verification_status", "pending")
    .select("id")
    .maybeSingle();

  if (profileError || !updatedProfile?.id) {
    if (profileError) {
      console.error("[seller-profile-review] profile approve failed:", profileError.message);
    }
    return false;
  }

  const { data: updatedRow, error: verError } = await admin
    .from("agent_verifications")
    .update({
      status: "approved",
      reviewed_at: now,
      verified_at: now,
      verification_notes: notes,
      nin_provider: "profile_review_auto",
    })
    .eq("id", verificationId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (verError || !updatedRow?.id) {
    await admin
      .from("profiles")
      .update({
        role: "agent_unverified",
        verification_status: "pending",
        verified_badge: false,
        verified_at: null,
      })
      .eq("id", userId)
      .eq("verification_status", "approved");
    return false;
  }

  return true;
}

export async function runSellerProfileReviewAfterSubmit(
  admin: SupabaseClient,
  params: {
    userId: string;
    verificationId: string;
    input: Omit<
      ProfileReviewInput,
      "duplicatePhoneUserIds" | "duplicateEmailUserIds" | "priorRejection"
    >;
    actorIp?: string | null;
  }
): Promise<SellerProfileReviewOutcome> {
  const { phoneIds, emailIds } = await findDuplicateUserIds(
    admin,
    params.userId,
    params.input.phone,
    params.input.email
  );
  const priorRejection = await hasPriorRejection(admin, params.userId);

  const input: ProfileReviewInput = {
    ...params.input,
    duplicatePhoneUserIds: phoneIds,
    duplicateEmailUserIds: emailIds,
    priorRejection,
  };

  const review = await runSellerProfileReview(input);
  const evidence = {
    duplicatePhoneCount: phoneIds.length,
    duplicateEmailCount: emailIds.length,
    priorRejection,
  };

  if (canAutoApproveSellerProfile(review, input)) {
    const approved = await applyAutoApproval(
      admin,
      params.userId,
      params.verificationId,
      review,
      evidence
    );
    if (approved) {
      await writeAuditLog({
        actor_id: params.userId,
        actor_role: "agent_unverified",
        action: "seller.profile_review.auto_approve",
        target_type: "agent_verification",
        target_id: params.verificationId,
        metadata: {
          confidence: review.confidence,
          reasonCodes: review.reasonCodes,
          modelVersion: review.modelVersion,
        },
        ip: params.actorIp ?? undefined,
      });
      return { outcome: "auto_approved", review };
    }
  }

  const notes = serializeSellerProfileReviewNotes(review, {
    ...evidence,
    decision: "queued_for_staff",
  });

  await admin
    .from("agent_verifications")
    .update({
      verification_notes: notes,
      nin_provider: "profile_review",
    })
    .eq("id", params.verificationId)
    .eq("status", "pending");

  await writeAuditLog({
    actor_id: params.userId,
    actor_role: "agent_unverified",
    action: "seller.profile_review.queued",
    target_type: "agent_verification",
    target_id: params.verificationId,
    metadata: {
      confidence: review.confidence,
      recommendation: review.recommendation,
      reasonCodes: review.reasonCodes,
      modelVersion: review.modelVersion,
      providerError: review.providerError,
    },
    ip: params.actorIp ?? undefined,
  });

  return { outcome: "queued", review };
}
