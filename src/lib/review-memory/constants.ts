/** Internal review memory — never expose publicly */

export type ReviewRiskLevel = "low" | "moderate" | "high" | "severe";

export type ReviewQueueGroup =
  | "ready_to_approve"
  | "needs_small_update"
  | "needs_explanation"
  | "high_risk"
  | "duplicate_photo_issue"
  | "pricing_anomaly"
  | "trusted_agent_batch";

export type ReviewSuggestedAction =
  | "approve"
  | "approve_rank_lower"
  | "request_update"
  | "ask_explain"
  | "ask_clearer_photos"
  | "ask_fee_breakdown"
  | "ask_location_correction"
  | "ask_document_evidence"
  | "send_enhanced_verification"
  | "reject"
  | "suspend";

export type ReviewRequestType =
  | "update"
  | "explain"
  | "upload_proof"
  | "clearer_photos"
  | "fee_clarity"
  | "location_correction"
  | "title_document";

export type ReviewDecisionType =
  | "approved"
  | "approved_after_explanation"
  | "approved_negotiable_landlord_terms"
  | "approved_rank_lower"
  | "approved_no_feature"
  | "rejected"
  | "rejected_fake_location"
  | "rejected_duplicate_photos"
  | "rejected_bait_pricing"
  | "requested_fee_clarity"
  | "requested_update"
  | "requested_explanation"
  | "requested_photos"
  | "requested_documents"
  | "lowered_visibility"
  | "held_for_review"
  | "promoted"
  | "agent_responded";

export const REVIEW_REQUEST_LABELS: Record<ReviewRequestType, string> = {
  update: "Ask agent to update",
  explain: "Ask agent to explain",
  upload_proof: "Ask company to upload proof",
  clearer_photos: "Ask for clearer photos",
  fee_clarity: "Ask for fee clarity",
  location_correction: "Ask for location correction",
  title_document: "Ask for title/document evidence",
};

export const REVIEW_REQUEST_TEMPLATES: Record<ReviewRequestType, string> = {
  update:
    "Please update this listing with the missing or unclear details noted in our review.",
  explain:
    "Please explain the pricing, fees, or terms so we can verify this listing accurately.",
  upload_proof:
    "Please upload supporting proof (CAC, agency letter, or ownership document) for this listing.",
  clearer_photos:
    "Please upload clearer, well-lit photos showing the actual property — exterior, interior, and key rooms.",
  fee_clarity:
    "Please clarify whether the agency fee is fixed, negotiable, or handled directly with the landlord.",
  location_correction:
    "Please confirm the exact area/landmark so renters can find this property easily.",
  title_document:
    "Please provide evidence for title/document claims (C of O, survey plan, deed of assignment, or governor's consent status).",
};

export const REVIEW_QUEUE_LABELS: Record<ReviewQueueGroup, string> = {
  ready_to_approve: "Ready to approve",
  needs_small_update: "Needs small update",
  needs_explanation: "Needs explanation",
  high_risk: "High risk",
  duplicate_photo_issue: "Duplicate / photo issue",
  pricing_anomaly: "Pricing anomaly",
  trusted_agent_batch: "Trusted agent batch",
};

export const REVIEW_ACTION_LABELS: Record<ReviewSuggestedAction, string> = {
  approve: "Approve",
  approve_rank_lower: "Approve but rank lower",
  request_update: "Request update",
  ask_explain: "Ask agent to explain",
  ask_clearer_photos: "Ask for clearer photos",
  ask_fee_breakdown: "Ask for fee breakdown",
  ask_location_correction: "Ask for location correction",
  ask_document_evidence: "Request document evidence",
  send_enhanced_verification: "Send enhanced verification",
  reject: "Reject",
  suspend: "Suspend listing",
};
