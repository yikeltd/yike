/**
 * Yike Transaction Workspace Engine — Communication Platform Service
 * Manages voice calling sessions, provider token generation, stream cards, & audit logs.
 */

import type { ParticipantRole } from "../types";
import type { CommunicationAggregate, CommunicationSessionStatus } from "./types";
import { getActiveCommunicationAdapter } from "./provider";
import { ConversationService } from "../conversation/service";
import { auditLogService } from "../audit";
import { dealRoomEvents } from "../events";
import { automationHooks } from "../hooks";
import { workspaceSearchIndex } from "../search";

class CommunicationRepository {
  private sessions: Map<string, CommunicationAggregate> = new Map();

  save(session: CommunicationAggregate): void {
    this.sessions.set(session.id, session);
  }

  getById(id: string): CommunicationAggregate | undefined {
    const s = this.sessions.get(id);
    return s && s.status === "active" ? s : undefined;
  }

  getByWorkspace(workspaceId: string): CommunicationAggregate[] {
    return Array.from(this.sessions.values())
      .filter((s) => s.workspaceId === workspaceId && s.status === "active")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
}

export const communicationRepo = new CommunicationRepository();

export class CommunicationService {
  /**
   * Initiates a real-time Voice Session bound to a Transaction Workspace
   */
  static async initiateVoiceSession(
    workspaceId: string,
    callerId: string,
    callerRole: ParticipantRole,
    receiverId: string,
    receiverRole: ParticipantRole,
    appointmentId?: string,
    negotiationId?: string
  ): Promise<CommunicationAggregate> {
    const adapter = getActiveCommunicationAdapter();
    const callInit = await adapter.initializeSession(workspaceId, "voice", callerId);
    const now = new Date().toISOString();

    const session: CommunicationAggregate = {
      id: callInit.sessionId,
      workspaceId,
      appointmentId,
      negotiationId,
      sessionType: "voice",
      sessionStatus: "ringing",
      callerId,
      callerRole,
      receiverId,
      receiverRole,
      channelName: callInit.channelName,
      token: callInit.token,
      durationSeconds: 0,
      quality: "excellent",
      providerId: adapter.id,
      participants: [
        { userId: callerId, role: callerRole, micMuted: false, speakerMuted: false, connectionState: "connecting" },
        { userId: receiverId, role: receiverRole, micMuted: false, speakerMuted: false, connectionState: "disconnected" },
      ],
      createdBy: callerId,
      createdAt: now,
      updatedAt: now,
      version: 1,
      status: "active",
    };

    communicationRepo.save(session);

    // 1. Embed Call Card into Conversation Stream
    ConversationService.embedCard(
      workspaceId,
      callerId,
      callerRole,
      "call_card",
      `Voice Call Requested`,
      {
        callId: session.id,
        callType: "voice",
        durationSeconds: 0,
        startedAt: now,
        quality: "excellent",
      }
    );

    // 2. Audit Log & Search Index
    auditLogService.log(workspaceId, "entity_created", callerId, callerRole, "VoiceSession", session.id, undefined, { provider: adapter.id });
    workspaceSearchIndex.indexResource(workspaceId, "message", session.id, "Voice Call", `Provider ${adapter.name}`, ["voice", "call"], callerId);

    // 3. Timeline Event & Automation Hooks
    const evt = dealRoomEvents.createEvent(workspaceId, callerId, callerRole, "voice_call_started", "Voice Call Requested", `Voice session initiated via ${adapter.name}`);
    void dealRoomEvents.publish(evt);
    void automationHooks.emit(evt);

    return session;
  }

  /**
   * Connects a Voice Session
   */
  static connectVoiceSession(sessionId: string, actorId: string): CommunicationAggregate {
    const session = communicationRepo.getById(sessionId);
    if (!session) throw new Error("Voice session not found.");

    const now = new Date().toISOString();
    const updatedParticipants = session.participants.map((p) => ({ ...p, connectionState: "connected" as const }));

    const updatedSession: CommunicationAggregate = {
      ...session,
      sessionStatus: "connected",
      startedAt: now,
      participants: updatedParticipants,
      updatedBy: actorId,
      updatedAt: now,
      version: session.version + 1,
    };

    communicationRepo.save(updatedSession);
    return updatedSession;
  }

  /**
   * Completes a Voice Session
   */
  static endVoiceSession(sessionId: string, actorId: string, durationSeconds = 125): CommunicationAggregate {
    const session = communicationRepo.getById(sessionId);
    if (!session) throw new Error("Voice session not found.");

    const now = new Date().toISOString();
    const updatedSession: CommunicationAggregate = {
      ...session,
      sessionStatus: "completed",
      endedAt: now,
      durationSeconds,
      updatedBy: actorId,
      updatedAt: now,
      version: session.version + 1,
    };

    communicationRepo.save(updatedSession);

    ConversationService.appendSystemEvent(
      session.workspaceId,
      actorId,
      session.callerRole,
      `📞 Voice Call Completed`,
      `Duration: ${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`
    );

    auditLogService.log(session.workspaceId, "entity_updated", actorId, session.callerRole, "VoiceSession", session.id, { status: session.sessionStatus }, { status: "completed", durationSeconds });
    const evt = dealRoomEvents.createEvent(session.workspaceId, actorId, session.callerRole, "voice_call_ended", "Voice Call Completed", `Duration ${durationSeconds}s`);
    void dealRoomEvents.publish(evt);
    void automationHooks.emit(evt);

    return updatedSession;
  }
}
