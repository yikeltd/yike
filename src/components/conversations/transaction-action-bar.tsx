"use client";

import { Calendar, CheckCircle2, HelpCircle, ShieldCheck, Tag, Video } from "lucide-react";
import type { TransactionActionType } from "@/lib/conversations/types";
import { cn } from "@/lib/utils";

const ACTIONS: Array<{
  id: TransactionActionType;
  label: string;
  icon: typeof Calendar;
  color: string;
}> = [
  { id: "schedule_viewing", label: "Schedule Viewing", icon: Calendar, color: "bg-navy text-white" },
  { id: "request_walkthrough", label: "Live Walkthrough", icon: Video, color: "bg-gold text-navy font-bold" },
  { id: "request_inspection", label: "Order Inspection", icon: ShieldCheck, color: "bg-emerald-600 text-white" },
  { id: "buyer_assistance", label: "Buyer Assistance", icon: HelpCircle, color: "bg-navy/10 text-navy" },
  { id: "make_offer", label: "Make Offer", icon: Tag, color: "bg-navy/10 text-navy" },
  { id: "mark_deal_completed", label: "Mark Completed", icon: CheckCircle2, color: "bg-emerald-100 text-emerald-800" },
];

export function TransactionActionBar({
  availableActions,
  onActionClick,
}: {
  availableActions: TransactionActionType[];
  onActionClick: (action: TransactionActionType) => void;
}) {
  return (
    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-2">
      {ACTIONS.filter((act) => availableActions.includes(act.id)).map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.id}
            type="button"
            onClick={() => onActionClick(act.id)}
            className={cn(
              "pressable flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold shadow-sm transition-all hover:scale-105",
              act.color
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{act.label}</span>
          </button>
        );
      })}
    </div>
  );
}
