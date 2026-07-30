/**
 * Yike Transaction Workspace Engine — Communication Platform Adapters
 * Provider-agnostic abstraction for Agora, LiveKit, Daily, WebRTC, or Mock drivers.
 */

import type { CommunicationSessionType, NetworkQuality } from "./types";

export interface CallSessionInit {
  sessionId: string;
  workspaceId: string;
  sessionType: CommunicationSessionType;
  channelName: string;
  token: string;
  initiatedBy: string;
  startedAt: string;
  providerId: string;
}

export interface PresenceState {
  userId: string;
  online: boolean;
  inCall: boolean;
  micMuted: boolean;
  speakerMuted: boolean;
  networkQuality: NetworkQuality;
}

export interface CommunicationProvider {
  id: string;
  name: string;
  initializeSession(workspaceId: string, type: CommunicationSessionType, userId: string): Promise<CallSessionInit>;
  joinSession(sessionId: string, userId: string): Promise<void>;
  leaveSession(sessionId: string, userId: string): Promise<void>;
  endSession(sessionId: string): Promise<void>;
  getPresence(workspaceId: string): Promise<PresenceState[]>;
}

/**
 * Official Agora RTC Adapter (Provider implementation)
 */
export class AgoraCommunicationAdapter implements CommunicationProvider {
  id = "agora_rtc";
  name = "Agora Real-Time Communication Provider";

  private appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "yike_agora_dev_app_id";

  async initializeSession(workspaceId: string, type: CommunicationSessionType, userId: string): Promise<CallSessionInit> {
    const channelName = `yike_channel_${workspaceId}_${Date.now()}`;
    const token = `agora_rtc_token_stub_${Math.random().toString(36).substring(2, 10)}`;

    return {
      sessionId: `session_agora_${Date.now()}`,
      workspaceId,
      sessionType: type,
      channelName,
      token,
      initiatedBy: userId,
      startedAt: new Date().toISOString(),
      providerId: this.id,
    };
  }

  async joinSession(): Promise<void> {}
  async leaveSession(): Promise<void> {}
  async endSession(): Promise<void> {}
  async getPresence(): Promise<PresenceState[]> {
    return [];
  }
}

/**
 * Development & Testing Mock Adapter
 */
export class MockCommunicationAdapter implements CommunicationProvider {
  id = "mock_rtc";
  name = "Mock Local Communication Provider";

  async initializeSession(workspaceId: string, type: CommunicationSessionType, userId: string): Promise<CallSessionInit> {
    return {
      sessionId: `session_mock_${Date.now()}`,
      workspaceId,
      sessionType: type,
      channelName: `yike_mock_${workspaceId}`,
      token: "mock_rtc_token",
      initiatedBy: userId,
      startedAt: new Date().toISOString(),
      providerId: this.id,
    };
  }

  async joinSession(): Promise<void> {}
  async leaveSession(): Promise<void> {}
  async endSession(): Promise<void> {}
  async getPresence(): Promise<PresenceState[]> {
    return [];
  }
}

let activeAdapter: CommunicationProvider = new AgoraCommunicationAdapter();

export function registerCommunicationAdapter(adapter: CommunicationProvider): void {
  activeAdapter = adapter;
}

export function getActiveCommunicationAdapter(): CommunicationProvider {
  return activeAdapter;
}
