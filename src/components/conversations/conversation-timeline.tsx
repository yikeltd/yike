"use client";

import { Calendar, CheckCircle2, ShieldCheck, Sparkles, User, Video } from "lucide-react";
import type { ConversationMessage, ConversationTimelineEvent } from "@/lib/conversations/types";
import { cn } from "@/lib/utils";

export function ConversationTimeline({
  timeline,
  messages,
  currentUserId,
}: {
  timeline: ConversationTimelineEvent[];
  messages: ConversationMessage[];
  currentUserId: string;
}) {
  // Combine system timeline events and messages chronologically
  type StreamItem =
    | { kind: "event"; payload: ConversationTimelineEvent; time: number }
    | { kind: "message"; payload: ConversationMessage; time: number };

  const items: StreamItem[] = [
    ...timeline.map((evt) => ({
      kind: "event" as const,
      payload: evt,
      time: new Date(evt.createdAt).getTime(),
    })),
    ...messages.map((msg) => ({
      kind: "message" as const,
      payload: msg,
      time: new Date(msg.createdAt).getTime(),
    })),
  ].sort((a, b) => a.time - b.time);

  return (
    <div className="space-y-4 py-4">
      {items.map((item) => {
        if (item.kind === "event") {
          const evt = item.payload;
          return (
            <div
              key={evt.id}
              className="my-3 flex items-center justify-center gap-2 text-center"
            >
              <div className="flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-bold text-navy shadow-sm">
                {evt.eventType === "viewing_scheduled" ? (
                  <Calendar className="h-3.5 w-3.5 text-gold-dark" />
                ) : evt.eventType === "inspection_requested" ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                ) : evt.eventType === "live_walkthrough_completed" ? (
                  <Video className="h-3.5 w-3.5 text-navy" />
                ) : evt.eventType === "deal_completed" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-gold-dark" />
                )}
                <span>{evt.title}</span>
                {evt.description ? (
                  <span className="font-medium text-navy/70">· {evt.description}</span>
                ) : null}
              </div>
            </div>
          );
        }

        const msg = item.payload;
        const isMe = msg.senderId === currentUserId;

        return (
          <div
            key={msg.id}
            className={cn("flex flex-col space-y-1", isMe ? "items-end" : "items-start")}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-navy/50">
              <span>{msg.senderName}</span>
              <span>·</span>
              <span>
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-medium shadow-sm sm:max-w-[70%]",
                isMe
                  ? "bg-navy text-white rounded-tr-none"
                  : "border border-navy/10 bg-white text-navy rounded-tl-none"
              )}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
