import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, PropertyStatus } from "@/types/database";
import {
  isSellerVerificationPending,
  isVerifiedSeller,
  type SellerTrustProfileSlice,
} from "./status";

/**
 * Launch listing workflow (maps onto existing PropertyStatus).
 *
 * Conceptual: Draft → Submitted → Under Review → Approved → Published
 * Storage today:
 *   - Draft: client-side / not yet inserted (no DB draft status)
 *   - Submitted / Under Review: status = "pending"
 *   - Approved / Published: status = "approved"
 */
export type ListingWorkflowStage =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "published";

export function mapPropertyStatusToWorkflow(
  status: PropertyStatus | string | null | undefined
): ListingWorkflowStage {
  switch (status) {
    case "approved":
      return "published";
    case "pending":
    case "flagged":
      return "under_review";
    case "rejected":
    case "hidden":
    case "archived":
    case "rented":
      return "submitted";
    default:
      return "draft";
  }
}

export const LISTING_WORKFLOW_LABELS: Record<ListingWorkflowStage, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  published: "Published",
};

/**
 * On first listing submit (or seller intent), move seller into
 * Pending Manual Verification if not already verified / pending.
 * Creates a lightweight agent_verifications queue row when missing.
 */
export async function ensurePendingManualSellerVerification(
  admin: SupabaseClient,
  userId: string,
  profile: Partial<SellerTrustProfileSlice> &
    Pick<Profile, "full_name" | "phone" | "whatsapp" | "email">
): Promise<{ enteredQueue: boolean }> {
  if (isVerifiedSeller(profile)) {
    return { enteredQueue: false };
  }
  if (isSellerVerificationPending(profile)) {
    return { enteredQueue: false };
  }

  const now = new Date().toISOString();

  await admin
    .from("profiles")
    .update({
      verification_status: "pending",
      verified_badge: false,
      verification_submitted_at: now,
      updated_at: now,
    })
    .eq("id", userId);

  const { data: latest } = await admin
    .from("agent_verifications")
    .select("id, status")
    .eq("agent_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest && (latest.status === "pending" || latest.status === "approved")) {
    return { enteredQueue: true };
  }

  const phone = (profile.whatsapp ?? profile.phone ?? "").trim() || null;
  const email = (profile.email ?? "").trim().toLowerCase() || null;

  await admin.from("agent_verifications").insert({
    agent_id: userId,
    user_id: userId,
    full_name: profile.full_name?.trim() || null,
    phone,
    email,
    status: "pending",
    nin_provider: "manual_review",
    nin_verified: false,
    selfie_url: null,
    verification_notes: "Auto-queued on first listing submit (Identity v1).",
    submitted_at: now,
  });

  return { enteredQueue: true };
}
