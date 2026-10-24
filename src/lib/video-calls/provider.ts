import { RtcRole, RtcTokenBuilder } from "agora-access-token";
import { createHash } from "node:crypto";
import { isFeatureEnabled } from "@/lib/feature-flags/index";

export type CallProviderSession = {
  providerId: string;
  sessionId: string;
  channelName: string;
  token: string | null;
  uid: number;
  configured: boolean;
  expiresAt: number | null;
};

function agoraUidForUser(userId: string): number {
  const hash = createHash("sha256").update(userId).digest();
  return hash.readUInt32BE(0) % 2_000_000_000 || 1;
}

/**
 * Server-side Agora RTC token minting. Certificate never leaves the server.
 */
export async function createCallProviderSession(input: {
  sessionId: string;
  callerId: string;
  calleeId: string;
  callType: "voice" | "video";
  participantUserId: string;
}): Promise<CallProviderSession> {
  const appId = process.env.AGORA_APP_ID?.trim();
  const appCert = process.env.AGORA_APP_CERTIFICATE?.trim();
  const channelName = `yike-call-${input.sessionId.replace(/-/g, "").slice(0, 32)}`;
  const uid = agoraUidForUser(input.participantUserId);

  if (!appId || !appCert) {
    return {
      providerId: "not_configured",
      sessionId: input.sessionId,
      channelName,
      token: null,
      uid,
      configured: false,
      expiresAt: null,
    };
  }

  if (input.callType === "video" && !isFeatureEnabled("video_call_beta")) {
    return {
      providerId: "agora_rtc",
      sessionId: input.sessionId,
      channelName,
      token: null,
      uid,
      configured: false,
      expiresAt: null,
    };
  }

  const expireSeconds = 3600;
  const privilegeExpire = Math.floor(Date.now() / 1000) + expireSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCert,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    privilegeExpire
  );

  return {
    providerId: "agora_rtc",
    sessionId: input.sessionId,
    channelName,
    token,
    uid,
    configured: true,
    expiresAt: privilegeExpire * 1000,
  };
}
