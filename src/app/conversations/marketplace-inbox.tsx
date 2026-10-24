"use client";

import Link from "next/link";
import type { MarketplaceConversationRow } from "@/lib/marketplace-messaging/service";

export function MarketplaceInbox({
  conversations,
  currentUserId,
}: {
  conversations: MarketplaceConversationRow[];
  currentUserId: string;
}) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-2xl border border-navy/10 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-navy">No conversations yet</p>
        <p className="mt-2 text-xs text-navy/60">
          Message a seller from a listing to start chatting on Yike.
        </p>
        <Link href="/search" className="pressable mt-4 inline-block text-sm font-bold text-gold-dark">
          Browse listings
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-navy/10 rounded-2xl border border-navy/10 bg-white">
      {conversations.map((c) => {
        const role = c.buyer_id === currentUserId ? "Buying" : "Selling";
        return (
          <li key={c.id}>
            <Link
              href={`/conversations/${c.id}`}
              className="pressable flex flex-col gap-1 px-4 py-3 hover:bg-surface/80"
            >
              <span className="text-xs font-bold uppercase tracking-wide text-gold-dark">
                {role} · {c.asset_type}
              </span>
              <span className="text-sm font-semibold text-navy">Listing {c.listing_id.slice(0, 8)}…</span>
              {c.last_message_at ? (
                <span className="text-[11px] text-muted">
                  Updated {new Date(c.last_message_at).toLocaleString("en-NG")}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
