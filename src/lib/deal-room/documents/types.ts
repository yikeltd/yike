/**
 * Yike Deal Room Platform — Document Center Architecture & Schemas
 */

export type DocumentCategory =
  | "photo"
  | "video"
  | "inspection_report"
  | "title_document"
  | "invoice"
  | "receipt"
  | "identity_document"
  | "contract"
  | "certificate";

export type VerificationState = "pending" | "verified" | "rejected" | "unverified";

export interface DocumentVersion {
  versionNumber: number;
  fileUrl: string;
  fileSizeBytes: number;
  uploadedBy: string;
  createdAt: string;
}

export interface DealDocument {
  id: string;
  dealRoomId: string;
  category: DocumentCategory;
  title: string;
  description?: string;
  mimeType: string;
  currentVersion: number;
  versions: DocumentVersion[];
  verificationState: VerificationState;
  verifiedBy?: string;
  verifiedAt?: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}
