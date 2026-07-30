"use client";

import { useState } from "react";
import type { CommunicationAggregate } from "@/lib/deal-room/communications/types";
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Wifi,
  Video,
  Monitor,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  session: CommunicationAggregate;
  currentUserId: string;
  onEndCall: () => void;
};

export function VoiceCallOverlay({ session, currentUserId, onEndCall }: Props) {
  const [micMuted, setMicMuted] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);

  const formattedTimer = `${Math.floor(session.durationSeconds / 60)
    .toString()
    .padStart(2, "0")}:${(session.durationSeconds % 60).toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-gradient-to-b from-[#07142B] via-[#031B4E] to-[#07142B] p-6 text-white shadow-2xl text-center space-y-6">
        {/* CONNECTION QUALITY HEADER */}
        <div className="flex items-center justify-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20 w-max mx-auto">
          <Wifi className="h-3.5 w-3.5" />
          <span className="capitalize">{session.quality} Connection</span>
        </div>

        {/* CALLER AVATAR & ANIMATED WAVEFORM */}
        <div className="space-y-3">
          <div className="relative mx-auto h-24 w-24">
            <div className="absolute inset-0 rounded-full bg-[#F59E0B]/20 animate-ping opacity-75" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-[#031B4E] to-[#E4B547] border-2 border-[#E4B547] text-white shadow-xl">
              <User className="h-10 w-10" />
            </div>
          </div>

          <div>
            <h3 className="text-base font-black">Transaction Voice Session</h3>
            <p className="text-xs text-slate-300 font-medium capitalize">
              {session.sessionStatus} • Provider: {session.providerId}
            </p>
          </div>

          <div className="text-3xl font-black tracking-wider text-[#E4B547] font-mono">
            {formattedTimer}
          </div>
        </div>

        {/* MEDIA CONTROLS GRID */}
        <div className="grid grid-cols-4 gap-3 pt-2">
          {/* MUTE MIC */}
          <button
            type="button"
            onClick={() => setMicMuted(!micMuted)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-2xl p-3 text-xs font-bold transition-all min-h-[64px]",
              micMuted ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-white/10 text-white hover:bg-white/20"
            )}
          >
            {micMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            <span className="text-[10px]">{micMuted ? "Muted" : "Mute"}</span>
          </button>

          {/* SPEAKER */}
          <button
            type="button"
            onClick={() => setSpeakerMuted(!speakerMuted)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-2xl p-3 text-xs font-bold transition-all min-h-[64px]",
              speakerMuted ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-white/10 text-white hover:bg-white/20"
            )}
          >
            {speakerMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            <span className="text-[10px]">{speakerMuted ? "Off" : "Speaker"}</span>
          </button>

          {/* VIDEO STUB (PHASE 6) */}
          <button
            type="button"
            disabled
            title="Video Calling available in Phase 6"
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/5 p-3 text-xs font-bold text-slate-500 opacity-50 cursor-not-allowed min-h-[64px]"
          >
            <Video className="h-5 w-5" />
            <span className="text-[10px]">Video</span>
          </button>

          {/* SCREEN SHARE STUB */}
          <button
            type="button"
            disabled
            title="Screen Sharing available in Phase 6"
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/5 p-3 text-xs font-bold text-slate-500 opacity-50 cursor-not-allowed min-h-[64px]"
          >
            <Monitor className="h-5 w-5" />
            <span className="text-[10px]">Share</span>
          </button>
        </div>

        {/* END CALL BUTTON */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onEndCall}
            className="pressable flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-3.5 text-sm font-black text-white shadow-xl hover:bg-red-700 min-h-[48px]"
          >
            <PhoneOff className="h-5 w-5" />
            <span>End Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}
