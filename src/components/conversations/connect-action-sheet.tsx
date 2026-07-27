"use client";

import { useState } from "react";
import { Calendar, MessageCircle, Phone, PhoneCall, Video, X } from "lucide-react";
import type { ConnectChannelOption, ConversationWorkspace } from "@/lib/conversations/types";
import { getConnectChannelOptions } from "@/lib/conversations/service";
import { cn } from "@/lib/utils";

const ICON_MAP = {
  MessageCircle,
  Phone,
  PhoneCall,
  Video,
  Calendar,
};

export function ConnectActionSheet({
  workspace,
  open,
  onClose,
  onTriggerAction,
}: {
  workspace: ConversationWorkspace;
  open: boolean;
  onClose: () => void;
  onTriggerAction: (actionName: string) => void;
}) {
  if (!open) return null;

  const options = getConnectChannelOptions(workspace);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/60 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className="w-full max-w-lg overflow-hidden rounded-t-3xl border border-navy/10 bg-white p-6 shadow-2xl transition-all sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-4 border-b border-navy/10">
          <div>
            <h3 className="text-lg font-bold text-navy">Connect Options</h3>
            <p className="text-xs font-medium text-navy/60">
              Direct connect channels for {workspace.seller.fullName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-navy/5 text-navy/60 hover:bg-navy/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          {options.map((opt) => {
            const Icon = ICON_MAP[opt.iconName as keyof typeof ICON_MAP] || Phone;
            const isDisabled = !opt.enabled;

            return (
              <div key={opt.id}>
                {opt.href && !isDisabled ? (
                  <a
                    href={opt.href}
                    target={opt.id === "whatsapp" ? "_blank" : undefined}
                    rel="noreferrer"
                    onClick={onClose}
                    className="pressable flex items-center justify-between rounded-2xl border border-navy/10 bg-white p-3.5 transition-all hover:border-gold/50 hover:bg-gold/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-gold-dark">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy">{opt.label}</p>
                        <p className="text-xs text-navy/60">{opt.sublabel}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-navy shadow-sm">
                      Connect
                    </span>
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      if (opt.action) {
                        onTriggerAction(opt.action);
                      }
                      onClose();
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition-all",
                      isDisabled
                        ? "border-navy/5 bg-navy/5 opacity-50 cursor-not-allowed"
                        : "pressable border-navy/10 bg-white hover:border-gold/50 hover:bg-gold/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                          isDisabled ? "bg-navy/10 text-navy/40" : "bg-gold/20 text-gold-dark"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy">{opt.label}</p>
                        <p className="text-xs text-navy/60">
                          {isDisabled ? "Beta / Unavailable for tier" : opt.sublabel}
                        </p>
                      </div>
                    </div>
                    {!isDisabled ? (
                      <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-navy shadow-sm">
                        Select
                      </span>
                    ) : null}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
