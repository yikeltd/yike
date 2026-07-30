/**
 * Yike Transaction Workspace Engine — Enterprise Visual Collaboration Platform Types
 * Dedicated visual session aggregates, remote inspection snapshots, & media contracts.
 */

import type { BaseEntity, ParticipantRole } from "../types";

export type VisualSessionType =
  | "video_call"
  | "remote_inspection"
  | "screen_share"
  | "presentation"
  | "evidence_capture"
  | "multi_camera"
  | "custom";

export type VisualSessionStatus =
  | "requested"
  | "ringing"
  | "connecting"
  | "connected"
  | "recording"
  | "paused"
  | "resumed"
  | "completed"
  | "cancelled"
  | "failed";

export interface VisualMediaState {
  userId: string;
  role: ParticipantRole;
  videoEnabled: boolean;
  audioEnabled: boolean;
  screenShareEnabled: boolean;
  pipActive: boolean;
}

export interface SnapshotRecord {
  id: string;
  capturedBy: string;
  capturedRole: ParticipantRole;
  timestamp: string;
  evidenceId: string;
  fileUrl: string;
  annotationText?: string;
}

export interface VisualSessionAggregate extends BaseEntity {
  workspaceId: string;
  executionId?: string;
  appointmentId?: string;
  sessionType: VisualSessionType;
  sessionStatus: VisualSessionStatus;
  callerId: string;
  callerRole: ParticipantRole;
  receiverId: string;
  receiverRole: ParticipantRole;
  channelName: string;
  token?: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds: number;
  mediaState: VisualMediaState[];
  snapshots: SnapshotRecord[];
  recordingActive: boolean;
  providerId: string;
  metadata?: Record<string, unknown>;
}
