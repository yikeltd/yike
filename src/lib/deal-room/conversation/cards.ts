/**
 * Yike Transaction Workspace Engine — Conversation Card Payloads
 * Embedded transaction card contracts rendering inside the intelligent stream.
 */

export interface OfferCardPayload {
  offerId: string;
  originalPrice: number;
  offeredPrice: number;
  currency: "NGN" | "USD";
  offerStatus: "submitted" | "countered" | "accepted" | "rejected" | "expired";
  expiresAt: string;
  note?: string;
}

export interface InspectionCardPayload {
  inspectionId: string;
  status: "requested" | "assigned" | "scheduled" | "completed";
  scheduledAt?: string;
  locationAddress: string;
  inspectorName?: string;
  overallRating?: number;
  reportSummary?: string;
}

export interface DocumentCardPayload {
  documentId: string;
  title: string;
  category: "title_document" | "inspection_report" | "invoice" | "receipt" | "contract" | "photo";
  fileUrl: string;
  mimeType: string;
  versionNumber: number;
  verificationState: "pending" | "verified" | "rejected";
}

export interface VerificationCardPayload {
  verificationId: string;
  subjectType: "seller_identity" | "business_registration" | "physical_lot" | "vehicle_title" | "property_title";
  status: "passed" | "pending" | "failed";
  score: number;
  badgeLabel: string;
}

export interface CallCardPayload {
  callId: string;
  callType: "voice" | "video";
  durationSeconds: number;
  startedAt: string;
  recordingUrl?: string;
  quality: "excellent" | "good" | "poor";
}

export interface PaymentCardPayload {
  paymentId: string;
  amount: number;
  currency: "NGN" | "USD";
  paymentType: "escrow_deposit" | "inspection_fee" | "milestone_disbursement" | "final_settlement";
  status: "pending" | "escrow_held" | "disbursed" | "refunded";
  referenceCode: string;
}
