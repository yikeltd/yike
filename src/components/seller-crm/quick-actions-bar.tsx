"use client";

import Link from "next/link";
import {
  Calendar,
  MessageSquare,
  PlusCircle,
  Shield,
  Tag,
} from "lucide-react";

export function QuickActionsBar({ sellerId }: { sellerId: string }) {
  return (
    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto rounded-3xl border border-navy/10 bg-white p-3 shadow-sm">
      <Link
        href="/agent/listings/choose"
        className="pressable flex shrink-0 items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-bold text-navy shadow-sm hover:bg-gold-light"
      >
        <PlusCircle className="h-4 w-4" />
        <span>Create Listing</span>
      </Link>

      <Link
        href="/conversations"
        className="pressable flex shrink-0 items-center gap-1.5 rounded-full bg-navy/10 px-4 py-2 text-xs font-bold text-navy hover:bg-navy/20"
      >
        <MessageSquare className="h-4 w-4" />
        <span>Reply to Messages</span>
      </Link>

      <Link
        href="/conversations?action=schedule_viewing"
        className="pressable flex shrink-0 items-center gap-1.5 rounded-full bg-navy/10 px-4 py-2 text-xs font-bold text-navy hover:bg-navy/20"
      >
        <Calendar className="h-4 w-4" />
        <span>Schedule Viewing</span>
      </Link>

      <Link
        href="/conversations?action=make_offer"
        className="pressable flex shrink-0 items-center gap-1.5 rounded-full bg-navy/10 px-4 py-2 text-xs font-bold text-navy hover:bg-navy/20"
      >
        <Tag className="h-4 w-4" />
        <span>Counter Offer</span>
      </Link>

      <Link
        href={`/trust/${encodeURIComponent(sellerId)}`}
        target="_blank"
        className="pressable flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-500/20"
      >
        <Shield className="h-4 w-4 text-emerald-700" />
        <span>View Trust Profile</span>
      </Link>
    </div>
  );
}
