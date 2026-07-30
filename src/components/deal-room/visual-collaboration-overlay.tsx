"use client";

import { useState } from "react";
import type { VisualSessionAggregate } from "@/lib/deal-room/visual/types";
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Camera,
  Circle,
  Wifi,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  session: VisualSessionAggregate;
  currentUserId: string;
  onEndSession: () => void;
  onTakeSnapshot?: () => void;
};

export function VisualCollaborationOverlay({ session, currentUserId, onEndSession, onTakeSnapshot }: Props) {
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-lg p-4 select-none animate-in fade-in duration-200">
      <div className="relative flex flex-col h-full w-full max-w-5xl rounded-3xl border border-white/10 bg-slate-900 text-white overflow-hidden shadow-2xl">
        {/* HEADER BAR */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-b from-slate-950/80 to-transparent z-10">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-black text-red-400 border border-red-500/30">
              <Circle className="h-2.5 w-2.5 fill-red-500 animate-pulse" />
              <span>{session.sessionType.replace("_", " ").toUpperCase()} LIVE</span>
            </span>
            <span className="text-xs font-bold text-slate-300">
              Snapshots Captured: {session.snapshots.length}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
            <Wifi className="h-3.5 w-3.5" />
            <span>HD Connection</span>
          </div>
        </div>

        {/* MAIN VIDEO STAGE */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center">
          {cameraOff ? (
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 text-slate-400 border border-white/10">
                <User className="h-10 w-10" />
              </div>
              <p className="text-xs font-bold text-slate-400">Camera is turned off</p>
            </div>
          ) : (
            <div className="relative h-full w-full bg-gradient-to-tr from-[#031B4E] to-[#07142B] flex items-center justify-center">
              <div className="text-center space-y-3">
                <Video className="mx-auto h-16 w-16 text-[#E4B547] animate-pulse" />
                <h3 className="text-lg font-black tracking-wide">
                  Remote Visual Inspection Stream
                </h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  High-definition live video feed active. Tap snapshot to capture evidence.
                </p>
              </div>

              {/* PIP PARTICIPANT WINDOW */}
              <div className="absolute bottom-4 right-4 h-32 w-48 rounded-2xl bg-slate-900 border-2 border-[#E4B547] shadow-xl overflow-hidden flex items-center justify-center">
                <User className="h-8 w-8 text-slate-500" />
              </div>
            </div>
          )}
        </div>

        {/* FLOATING GLASS MORTHIC CONTROL BAR */}
        <div className="flex items-center justify-center gap-3 p-4 bg-slate-950/90 border-t border-white/10 z-10">
          <button
            type="button"
            onClick={() => setMicMuted(!micMuted)}
            className={cn(
              "flex items-center justify-center h-12 w-12 rounded-2xl transition-all min-h-[48px]",
              micMuted ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-white/10 text-white hover:bg-white/20"
            )}
            title={micMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {micMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={() => setCameraOff(!cameraOff)}
            className={cn(
              "flex items-center justify-center h-12 w-12 rounded-2xl transition-all min-h-[48px]",
              cameraOff ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-white/10 text-white hover:bg-white/20"
            )}
            title={cameraOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {cameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={() => setIsSharingScreen(!isSharingScreen)}
            className={cn(
              "flex items-center justify-center h-12 w-12 rounded-2xl transition-all min-h-[48px]",
              isSharingScreen ? "bg-blue-500/20 text-blue-400 border border-blue-500/40" : "bg-white/10 text-white hover:bg-white/20"
            )}
            title="Share Screen"
          >
            <Monitor className="h-5 w-5" />
          </button>

          {/* EVIDENCE SNAPSHOT CAMERA TRIGGER */}
          <button
            type="button"
            onClick={onTakeSnapshot}
            className="pressable flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#E4B547] to-[#F59E0B] px-5 py-3 text-xs font-black text-slate-950 shadow-xl hover:brightness-110 min-h-[48px]"
          >
            <Camera className="h-5 w-5" />
            <span>Capture Evidence Snapshot</span>
          </button>

          <button
            type="button"
            onClick={onEndSession}
            className="pressable flex items-center justify-center h-12 w-12 rounded-2xl bg-red-600 text-white shadow-xl hover:bg-red-700 min-h-[48px]"
            title="End Visual Session"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
