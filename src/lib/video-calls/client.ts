export type VideoCallTerminalStatus =
  | "failed"
  | "declined"
  | "missed"
  | "cancelled"
  | "ended";

export type FinalizeVideoCallResult =
  | { ok: true; reused: boolean }
  | { ok: false; error: string; code?: string };

/** Idempotent server finalize — caller or callee only (see API auth). */
export async function finalizeVideoCallSession(
  sessionId: string,
  status: VideoCallTerminalStatus
): Promise<FinalizeVideoCallResult> {
  const res = await fetch(`/api/video-calls/${encodeURIComponent(sessionId)}/finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const json = (await res.json()) as {
    error?: string;
    code?: string;
    reused?: boolean;
  };
  if (!res.ok) {
    return { ok: false, error: json.error ?? "Could not finalize call", code: json.code };
  }
  return { ok: true, reused: Boolean(json.reused) };
}
