/**
 * Yike Deal Room Platform — Inspection Workflow Schemas
 */

export type InspectionStatus =
  | "requested"
  | "assigned"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface InspectionEvidence {
  id: string;
  fileUrl: string;
  caption: string;
  uploadedAt: string;
}

export interface DealInspection {
  id: string;
  dealRoomId: string;
  listingId: string;
  requestedBy: string;
  assignedInspectorId?: string;
  scheduledAt?: string;
  locationAddress: string;
  status: InspectionStatus;
  overallRating?: number;
  reportSummary?: string;
  evidence: InspectionEvidence[];
  createdAt: string;
  updatedAt: string;
}
