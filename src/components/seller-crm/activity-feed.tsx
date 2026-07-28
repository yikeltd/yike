"use client";

import Link from "next/link";
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldCheck,
  Tag,
} from "lucide-react";
import type { ActivityItem } from "@/lib/seller-crm/types";

const ICON_MAP = {
  new_conversation: MessageSquare,
  new_message: MessageSquare,
  viewing_confirmed: Calendar,
  inspection_completed: ShieldCheck,
  offer_received: Tag,
  offer_accepted: CheckCircle2,
  review_received: CheckCircle2,
  badge_earned: Award,
  case_updated: Clock,
};

export function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  return (
    <div className="space-y-3">
      {activities.map((act) => {
        const Icon = ICON_MAP[act.type] || Clock;

        return (
          <div
            key={act.id}
            className="flex items-start justify-between rounded-3xl border border-navy/10 bg-white p-4 shadow-sm transition-all hover:border-gold/50"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gold/20 text-gold-dark">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-navy">{act.title}</h4>
                <p className="text-xs text-navy/70 leading-relaxed">{act.description}</p>
                <span className="mt-1 block text-[10px] font-semibold text-navy/40">
                  {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>

            {act.linkHref && (
              <Link
                href={act.linkHref}
                className="pressable rounded-full bg-navy/10 px-3.5 py-1.5 text-xs font-bold text-navy hover:bg-navy/20 shrink-0"
              >
                View
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
