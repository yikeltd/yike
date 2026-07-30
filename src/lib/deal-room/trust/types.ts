/**
 * Yike Transaction Workspace Engine — Trust & Verification Platform Types
 * Dedicated verification aggregate, evidence models, & weighted Trust Score calculation.
 */

import type { BaseEntity, ParticipantRole } from "../types";

export type VerificationType =
  | "identity"
  | "business"
  | "property"
  | "vehicle"
  | "ownership"
  | "title"
  | "inspection"
  | "phone"
  | "email"
  | "address"
  | "document"
  | "custom";

export type VerificationStatus =
  | "pending"
  | "submitted"
  | "in_review"
  | "verified"
  | "partially_verified"
  | "rejected"
  | "expired"
  | "revoked"
  | "appealed";

export interface VerificationEvidence {
  id: string;
  type: "image" | "pdf" | "certificate" | "gps" | "metadata";
  url: string;
  title: string;
  uploadedAt: string;
}

export interface VerificationAggregate extends BaseEntity {
  workspaceId: string;
  subjectId: string;
  subjectType: "user" | "listing" | "document";
  verificationType: VerificationType;
  verificationStatus: VerificationStatus;
  confidenceScore: number; // 0 to 100
  reviewerId?: string;
  reviewerRole?: ParticipantRole;
  evidence: VerificationEvidence[];
  rejectionReason?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface TrustScoreBreakdown {
  overallScore: number; // 0 to 100
  identityScore: number;
  documentScore: number;
  historyScore: number;
  badgeLevel: "unverified" | "basic_trust" | "verified" | "high_trust";
  verificationsCount: number;
  lastUpdated: string;
}
