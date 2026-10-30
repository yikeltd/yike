"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";

export type AgoraCallCredentials = {
  appId: string;
  channelName: string;
  token: string;
  uid: number;
  callType: "voice" | "video";
};

type Props = {
  sessionId: string;
  label?: string;
  onHangUp: () => void;
  className?: string;
};

type MediaPhase = "idle" | "joining" | "connected" | "failed";

export function AgoraCallRoom({ sessionId, label, onHangUp, className }: Props) {
  const [phase, setPhase] = useState<MediaPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const localRef = useRef<HTMLDivElement>(null);
  const remoteRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<{ leave: () => Promise<void> } | null>(null);
  const tracksRef = useRef<{ close: () => void }[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function join() {
      setPhase("joining");
      setError(null);

      try {
        const tokenRes = await fetch(
          `/api/video-calls/${encodeURIComponent(sessionId)}/token`,
          { cache: "no-store" },
        );
        const tokenJson = (await tokenRes.json()) as {
          provider?: AgoraCallCredentials & { configured?: boolean };
          error?: string;
        };

        if (!tokenRes.ok) {
          throw new Error(tokenJson.error ?? "Could not authorize call");
        }

        const provider = tokenJson.provider;
        const appId = provider?.appId ?? null;
        if (!provider?.configured || !provider.token || !appId) {
          throw new Error(
            "Live media is not configured. Set AGORA_APP_ID, AGORA_APP_CERTIFICATE, and NEXT_PUBLIC_AGORA_APP_ID.",
          );
        }

        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          if (mediaType === "video" && user.videoTrack && remoteRef.current) {
            user.videoTrack.play(remoteRef.current);
          }
          if (mediaType === "audio" && user.audioTrack) {
            user.audioTrack.play();
          }
        });

        await client.join(appId, provider.channelName, provider.token, provider.uid);

        const tracks: { close: () => void }[] = [];
        const mic = await AgoraRTC.createMicrophoneAudioTrack();
        tracks.push(mic);

        let cam: Awaited<ReturnType<typeof AgoraRTC.createCameraVideoTrack>> | null = null;
        const callType = provider.callType ?? "video";
        if (callType === "video") {
          cam = await AgoraRTC.createCameraVideoTrack();
          tracks.push(cam);
          if (localRef.current) cam.play(localRef.current);
        }

        tracksRef.current = tracks;
        await client.publish(cam ? [mic, cam] : [mic]);

        if (!cancelled) setPhase("connected");
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Could not join call";
        if (msg.toLowerCase().includes("notallowed") || msg.toLowerCase().includes("permission")) {
          setError("Camera or microphone permission was denied.");
        } else {
          setError(msg);
        }
        setPhase("failed");
      }
    }

    void join();

    return () => {
      cancelled = true;
      for (const t of tracksRef.current) {
        try {
          t.close();
        } catch {
          /* ignore */
        }
      }
      tracksRef.current = [];
      void clientRef.current?.leave().catch(() => undefined);
      clientRef.current = null;
    };
  }, [sessionId]);

  async function hangUp() {
    for (const t of tracksRef.current) {
      try {
        t.close();
      } catch {
        /* ignore */
      }
    }
    tracksRef.current = [];
    await clientRef.current?.leave().catch(() => undefined);
    clientRef.current = null;
    onHangUp();
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex flex-col bg-navy/95 text-white",
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-sm font-bold">{label ?? "Yike call"}</p>
          <p className="text-xs text-white/70">
            {phase === "joining"
              ? "Connecting media…"
              : phase === "connected"
                ? "Connected"
                : phase === "failed"
                  ? "Connection failed"
                  : "Starting…"}
          </p>
        </div>
      </div>

      <div className="relative flex-1 px-4 pb-4">
        <div
          ref={remoteRef}
          className="h-full w-full overflow-hidden rounded-2xl bg-black/40"
        />
        <div
          ref={localRef}
          className="absolute bottom-6 right-6 h-28 w-20 overflow-hidden rounded-xl border border-white/20 bg-black/60 shadow-lg"
        />
      </div>

      {error ? (
        <p className="px-4 pb-2 text-center text-xs text-amber-200">{error}</p>
      ) : null}

      <div className="flex items-center justify-center gap-3 px-4 pb-8">
        <button
          type="button"
          onClick={() => {
            setMuted((m) => !m);
            const mic = tracksRef.current[0] as { setEnabled?: (v: boolean) => void } | undefined;
            mic?.setEnabled?.(!muted);
          }}
          className="pressable flex h-12 w-12 items-center justify-center rounded-full bg-white/15"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={() => {
            setVideoOff((v) => !v);
            const cam = tracksRef.current[1] as { setEnabled?: (v: boolean) => void } | undefined;
            cam?.setEnabled?.(!videoOff);
          }}
          className="pressable flex h-12 w-12 items-center justify-center rounded-full bg-white/15"
          aria-label={videoOff ? "Turn camera on" : "Turn camera off"}
        >
          {videoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={() => void hangUp()}
          className="pressable flex h-14 w-14 items-center justify-center rounded-full bg-red-600"
          aria-label="End call"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
