"use client";

import { useMemo, useState } from "react";
import type { ConversationItem } from "@/lib/deal-room/conversation/types";
import type {
  OfferCardPayload,
  InspectionCardPayload,
  DocumentCardPayload,
  VerificationCardPayload,
} from "@/lib/deal-room/conversation/cards";
import {
  Send,
  Paperclip,
  Pin,
  CheckCheck,
  ShieldCheck,
  Calendar,
  FileText,
  DollarSign,
  Sparkles,
  Bot,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  workspaceId: string;
  items: ConversationItem[];
  currentUserId: string;
  currentUserRole: string;
  onSendMessage?: (content: string) => void;
};

export function ConversationWorkspace({
  items: initialItems,
  currentUserId,
  onSendMessage,
}: Props) {
  const [items, setItems] = useState<ConversationItem[]>(initialItems);
  const [inputText, setInputText] = useState("");
  const [filterPinnedOnly, setFilterPinnedOnly] = useState(false);

  const pinnedCount = useMemo(() => items.filter((i) => i.pinned).length, [items]);

  const displayedItems = useMemo(() => {
    if (filterPinnedOnly) return items.filter((i) => i.pinned);
    return items;
  }, [items, filterPinnedOnly]);

  function handleSend() {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText("");

    if (onSendMessage) {
      onSendMessage(text);
    } else {
      // Local optimistic append
      const now = new Date().toISOString();
      const newItem: ConversationItem = {
        id: `citem_local_${Date.now()}`,
        workspaceId: "local",
        itemType: "user_message",
        actorId: currentUserId,
        actorRole: "buyer",
        content: text,
        pinned: false,
        createdBy: currentUserId,
        createdAt: now,
        updatedAt: now,
        version: 1,
        status: "active",
      };
      setItems((prev) => [...prev, newItem]);
    }
  }

  return (
    <div className="flex flex-col h-[650px] w-full rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden select-none">
      {/* TOOLBAR & PINNED ITEMS HEADER */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#F59E0B]" />
          <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-[#031B4E]">
            Transaction Stream
          </h3>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            {items.length} events
          </span>
        </div>

        <button
          type="button"
          onClick={() => setFilterPinnedOnly(!filterPinnedOnly)}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all min-h-[36px]",
            filterPinnedOnly
              ? "bg-[#F59E0B] text-[#031B4E] shadow-2xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          <Pin className="h-3.5 w-3.5" />
          <span>Pinned ({pinnedCount})</span>
        </button>
      </div>

      {/* CHRONOLOGICAL STREAM FEED */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/40">
        {displayedItems.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Bot className="mx-auto h-8 w-8 text-[#F59E0B]" />
            <p className="text-xs font-extrabold text-[#031B4E]">
              Intelligent Transaction Stream Ready
            </p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Messages, offers, documents, and inspection milestones will appear here in order.
            </p>
          </div>
        ) : (
          displayedItems.map((item) => {
            const isMe = item.actorId === currentUserId;

            // 1. SYSTEM EVENT BADGE
            if (item.itemType === "system_event") {
              return (
                <div key={item.id} className="flex justify-center my-2">
                  <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/90 px-4 py-1.5 text-[11px] font-bold text-[#031B4E] shadow-2xs">
                    <Sparkles className="h-3.5 w-3.5 text-[#F59E0B]" />
                    <span>{item.content}</span>
                  </div>
                </div>
              );
            }

            // 2. EMBEDDED OFFER CARD
            if (item.itemType === "offer_card") {
              const offer = item.payload as unknown as OfferCardPayload;
              return (
                <div key={item.id} className="flex justify-center my-3">
                  <div className="w-full max-w-md rounded-3xl border border-amber-300 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/50 p-4 space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-black uppercase text-[#031B4E]">
                        <DollarSign className="h-4 w-4 text-[#F59E0B]" />
                        <span>Structured Offer</span>
                      </div>
                      <span className="rounded-full bg-[#F59E0B] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#031B4E]">
                        {offer?.offerStatus || "Submitted"}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400">Offered Price</span>
                        <p className="text-lg md:text-xl font-black text-[#031B4E]">
                          ₦{Number(offer?.offeredPrice || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Original</span>
                        <p className="text-xs font-bold text-slate-400 line-through">
                          ₦{Number(offer?.originalPrice || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {offer?.note && (
                      <p className="text-[11px] font-medium text-slate-600 bg-white/80 rounded-xl p-2 border border-slate-200/60">
                        &quot;{offer.note}&quot;
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        className="pressable flex-1 rounded-xl bg-[#F59E0B] py-2 text-xs font-black text-[#031B4E] shadow-2xs hover:bg-amber-400 min-h-[38px]"
                      >
                        Accept Offer
                      </button>
                      <button
                        type="button"
                        className="pressable flex-1 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-[#031B4E] hover:bg-slate-50 min-h-[38px]"
                      >
                        Counter
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // 3. EMBEDDED INSPECTION CARD
            if (item.itemType === "inspection_card") {
              const insp = item.payload as unknown as InspectionCardPayload;
              return (
                <div key={item.id} className="flex justify-center my-3">
                  <div className="w-full max-w-md rounded-3xl border border-blue-200 bg-white p-4 space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-black uppercase text-[#031B4E]">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span>Field Inspection</span>
                      </div>
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-blue-600">
                        {insp?.status || "Scheduled"}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-[#031B4E]">📍 {insp?.locationAddress || "Lekki Lot"}</p>
                      {insp?.scheduledAt && (
                        <p className="font-medium text-slate-500">📅 {insp.scheduledAt}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // 4. EMBEDDED DOCUMENT CARD
            if (item.itemType === "document_card") {
              const doc = item.payload as unknown as DocumentCardPayload;
              return (
                <div key={item.id} className="flex justify-center my-3">
                  <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 flex-shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-[#031B4E]">{doc?.title || "Title Document"}</h4>
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <p className="text-[10px] font-medium text-slate-500">
                          v{doc?.versionNumber || 1} • Verified Document
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="pressable rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#031B4E] hover:bg-slate-200 min-h-[36px]"
                    >
                      View
                    </button>
                  </div>
                </div>
              );
            }

            // 5. USER MESSAGE BUBBLE
            return (
              <div
                key={item.id}
                className={cn("flex items-end gap-2.5", isMe ? "flex-row-reverse" : "flex-row")}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-[#031B4E] text-xs font-black flex-shrink-0">
                  <User className="h-4 w-4" />
                </div>

                <div
                  className={cn(
                    "max-w-[78%] rounded-3xl px-4 py-3 text-xs md:text-sm font-medium shadow-2xs space-y-1",
                    isMe
                      ? "bg-[#031B4E] text-white rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                  )}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{item.content}</p>
                  <div className={cn("flex items-center justify-end gap-1 text-[10px]", isMe ? "text-slate-300" : "text-slate-400")}>
                    <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {isMe && <CheckCheck className="h-3 w-3 text-emerald-400" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* STICKY COMPOSER BAR */}
      <div className="border-t border-slate-200 bg-white p-3 md:p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors flex-shrink-0"
            title="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Write an intelligent message or proposal..."
            className="flex-1 h-11 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-xs md:text-sm font-medium text-[#031B4E] focus:bg-white focus:border-[#F59E0B] focus:outline-none focus:ring-4 focus:ring-[#F59E0B]/20"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="pressable flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F59E0B] text-[#031B4E] shadow-md hover:bg-amber-400 disabled:opacity-40 flex-shrink-0 min-w-[44px]"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
