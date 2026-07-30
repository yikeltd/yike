/**
 * Yike Transaction Workspace Engine — Enterprise Intelligence Platform Types
 * Provider-agnostic AI capability contracts, structured output models, & context engine.
 */

import type { BaseEntity } from "../types";

export type IntelligenceCapability =
  | "reasoning"
  | "vision_analysis"
  | "ocr"
  | "summarization"
  | "classification"
  | "extraction"
  | "recommendation"
  | "translation"
  | "fraud_detection"
  | "risk_assessment";

export type IntelligenceRequestStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "cached"
  | "expired";

export interface IntelligenceOutput {
  summary?: string;
  recommendations?: string[];
  riskFlags?: string[];
  inspectionFindings?: string[];
  extractedFields?: Record<string, string | number | boolean>;
  confidenceScore: number; // 0 to 100
  executionTimeMs: number;
  tokenCount: number;
  providerId: string;
  modelName: string;
}

export interface IntelligenceRequestAggregate extends BaseEntity {
  workspaceId: string;
  capability: IntelligenceCapability;
  requestStatus: IntelligenceRequestStatus;
  inputPrompt: string;
  contextData?: Record<string, unknown>;
  output?: IntelligenceOutput;
  providerId: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}
