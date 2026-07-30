/**
 * Yike Transaction Workspace Engine — Visual Collaboration Service
 * Manages remote video inspection sessions, live snapshot evidence capture, & stream cards.
 */

import type { ParticipantRole } from "../types";
import type {
  SnapshotRecord,
  VisualMediaState,
  VisualSessionAggregate,
  VisualSessionStatus,
  VisualSessionType,
} from "./types";
import { getActiveCommunicationAdapter } from "../communications/provider";
import { EvidenceService } from "../evidence/service";
import { ConversationService } from "../conversation/service";
import { auditLogService } from "../audit";
import { dealRoomEvents } from "../events";
import { automationHooks } from "../hooks";
import { workspaceSearchIndex } from "../search";

class VisualSessionRepository {
  private sessions: Map<string, VisualSessionAggregate> = new Map();

  save(session: VisualSessionAggregate): void {
    this.sessions.set(session.id, session);
  }

  getById(id: string): VisualSessionAggregate | undefined {
    const s = this.sessions.get(id);
    return s && s.status === "active" ? s : undefined;
  }

  getByWorkspace(workspaceId: string): VisualSessionAggregate[] {
    return Array.from(this.sessions.values())
      .filter((s) => s.workspaceId === workspaceId && s.status === "active")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
}

export const visualSessionRepo = new VisualSessionRepository();

export class VisualSessionService {
  /**
   * Starts a real-time Visual Collaboration Session (Video Call / Remote Inspection)
   */
  static async startVisualSession(
    workspaceId: string,
    sessionType: VisualSessionType,
    callerId: string,
    callerRole: ParticipantRole,
    receiverId: string,
    receiverRole: ParticipantRole,
    executionId?: string,
    appointmentId?: string
  ): Promise<VisualSessionAggregate> {
    const adapter = getActiveCommunicationAdapter();
    const callInit = await adapter.initializeSession(workspaceId, "video", callerId);
    const now = new Date().toISOString();

    const initialMedia: VisualMediaState[] = [
      { userId: callerId, role: callerRole, videoEnabled: true, audioEnabled: true, screenShareEnabled: false, pipActive: false },
      { userId: receiverId, role: receiverRole, videoEnabled: true, audioEnabled: true, screenShareEnabled: false, pipActive: false },
    ];

    const session: VisualSessionAggregate = {
      id: callInit.sessionId,
      workspaceId,
      executionId,
      appointmentId,
      sessionType,
      sessionStatus: "connected",
      callerId,
      callerRole,
      receiverId,
      receiverRole,
      channelName: callInit.channelName,
      token: callInit.token,
      startedAt: now,
      durationSeconds: 0,
      mediaState: initialMedia,
      snapshots: [],
      recordingActive: false,
      providerId: adapter.id,
      createdBy: callerId,
      createdAt: now,
      updatedAt: now,
      version: 1,
      status: "active",
    };

    visualSessionRepo.save(session);

    // 1. Embed Call/Video Card into Conversation Stream
    ConversationService.embedCard(
      workspaceId,
      callerId,
      callerRole,
      "call_card",
      `Visual Collaboration: ${sessionType.replace("_", " ").toUpperCase()}`,
      {
        callId: session.id,
        callType: "video",
        durationSeconds: 0,
        startedAt: now,
        quality: "excellent",
      }
    );

    // 2. Audit Log & Search Index
    auditLogService.log(workspaceId, "entity_created", callerId, callerRole, "VisualSession", session.id, undefined, { type: sessionType, provider: adapter.id });
    workspaceSearchIndex.indexResource(workspaceId, "message", session.id, `${sessionType} Session`, `Provider ${adapter.name}`, ["video", "visual"], callerId);

    // 3. Timeline Event & Automation Hooks
    const evt = dealRoomEvents.createEvent(workspaceId, callerId, callerRole, "video_call_started", "Visual Session Started", `${sessionType} initiated`);
    void dealRoomEvents.publish(evt);
    void automationHooks.emit(evt);

    return session;
  }

  /**
   * Captures a live video snapshot and automatically uploads it to the Evidence Platform
   */
  static captureSnapshot(
    sessionId: string,
    imageUrl: string,
    actorId: string,
    actorRole: ParticipantRole,
    annotationText?: string
  ): SnapshotRecord {
    const session = visualSessionRepo.getById(sessionId);
    if (!session) throw new Error("Visual session not found.");

    const now = new Date().toISOString();
    const snapshotId = `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // 1. Upload to Evidence Platform
    const evidence = EvidenceService.uploadEvidence(
      session.workspaceId,
      "inspection",
      session.executionId || session.id,
      "inspection_photo",
      `Remote Video Snapshot (${session.sessionType})`,
      imageUrl,
      204800, // 200 KB
      "image/webp",
      actorId,
      actorRole,
      annotationText || `Captured during visual session ${session.id}`
    );

    const snapshot: SnapshotRecord = {
      id: snapshotId,
      capturedBy: actorId,
      capturedRole: actorRole,
      timestamp: now,
      evidenceId: evidence.id,
      fileUrl: imageUrl,
      annotationText,
    };

    const updatedSession: VisualSessionAggregate = {
      ...session,
      snapshots: [...session.snapshots, snapshot],
      updatedBy: actorId,
      updatedAt: now,
      version: session.version + 1,
    };

    visualSessionRepo.save(updatedSession);
    return snapshot;
  }

  /**
   * Completes a Visual Session
   */
  static endVisualSession(sessionId: string, actorId: string, durationSeconds = 240): VisualSessionAggregate {
    const session = visualSessionRepo.getById(sessionId);
    if (!session) throw new Error("Visual session not found.");

    const now = new Date().toISOString();
    const updatedSession: VisualSessionAggregate = {
      ...session,
      sessionStatus: "completed",
      endedAt: now,
      durationSeconds,
      updatedBy: actorId,
      updatedAt: now,
      version: session.version + 1,
    };

    visualSessionRepo.save(updatedSession);

    ConversationService.appendSystemEvent(
      session.workspaceId,
      actorId,
      session.callerRole,
      `📹 Visual Session Completed`,
      `Duration: ${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s • ${session.snapshots.length} Snapshots Captured`
    );

    auditLogService.log(session.workspaceId, "entity_updated", actorId, session.callerRole, "VisualSession", session.id, { status: session.sessionStatus }, { status: "completed", durationSeconds, snapshots: session.snapshots.length });
    const evt = dealRoomEvents.createEvent(session.workspaceId, actorId, session.callerRole, "video_call_ended", "Visual Session Completed", `Duration ${durationSeconds}s`);
    void dealRoomEvents.publish(evt);
    void automationHooks.emit(evt);

    return updatedSession;
  }
}
