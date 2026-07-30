/**
 * Yike Deal Room Platform — Communication Abstraction Layer
 * Provider-agnostic interface supporting Agora, WebRTC, Daily.co, or Mock drivers.
 */

export type CallType = "voice" | "video";
export type NetworkQuality = "excellent" | "good" | "poor" | "offline";

export interface CallSession {
  sessionId: string;
  dealRoomId: string;
  type: CallType;
  channelName: string;
  token: string;
  initiatedBy: string;
  startedAt: string;
  recordingEnabled: boolean;
}

export interface PresenceState {
  userId: string;
  online: boolean;
  inCall: boolean;
  micMuted: boolean;
  cameraMuted: boolean;
  networkQuality: NetworkQuality;
}

export interface CommunicationProvider {
  id: string;
  name: string;
  initializeSession(dealRoomId: string, type: CallType, userId: string): Promise<CallSession>;
  joinSession(sessionId: string, userId: string): Promise<void>;
  leaveSession(sessionId: string, userId: string): Promise<void>;
  endSession(sessionId: string): Promise<void>;
  getPresence(dealRoomId: string): Promise<PresenceState[]>;
}

class MockCommunicationProvider implements CommunicationProvider {
  id = "mock_provider";
  name = "Mock Local Communication Provider";

  async initializeSession(dealRoomId: string, type: CallType, userId: string): Promise<CallSession> {
    return {
      sessionId: `session_${Date.now()}`,
      dealRoomId,
      type,
      channelName: `yike_deal_${dealRoomId}`,
      token: "mock_token_stub",
      initiatedBy: userId,
      startedAt: new Date().toISOString(),
      recordingEnabled: false,
    };
  }

  async joinSession(): Promise<void> {}
  async leaveSession(): Promise<void> {}
  async endSession(): Promise<void> {}

  async getPresence(): Promise<PresenceState[]> {
    return [];
  }
}

let activeProvider: CommunicationProvider = new MockCommunicationProvider();

export function registerCommunicationProvider(provider: CommunicationProvider): void {
  activeProvider = provider;
}

export function getCommunicationProvider(): CommunicationProvider {
  return activeProvider;
}
