/**
 * Yike Transaction Workspace Engine — Enterprise Communication Platform Types
 * Provider-agnostic real-time voice, video, presence, & session quality contracts.
 */

import type { BaseEntity, ParticipantRole } from "../types";

export type CommunicationSessionType = "voice" | "video" | "screen_share" | "group_call";

export type CommunicationSessionStatus =
  | "requested"
  | "ringing"
  | "accepted"
  | "declined"
  | "busy"
  | "missed"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "completed"
  | "cancelled"
  | "failed";

export type NetworkQuality = "excellent" | "good" | "poor" | "offline";

export interface ParticipantMediaState {
  userId: string;
  role: ParticipantRole;
  micMuted: boolean;
  speakerMuted: boolean;
  connectionState: "connected" | "connecting" | "disconnected";
}

export interface CommunicationAggregate extends BaseEntity {
  workspaceId: string;
  appointmentId?: string;
  negotiationId?: string;
  sessionType: CommunicationSessionType;
  sessionStatus: CommunicationSessionStatus;
  callerId: string;
  callerRole: ParticipantRole;
  receiverId: string;
  receiverRole: ParticipantRole;
  channelName: string;
  token?: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds: number;
  quality: NetworkQuality;
  participants: ParticipantMediaState[];
  providerId: string;
  recordingId?: string;
  transcriptId?: string;
  metadata?: Record<string, unknown>;
}
