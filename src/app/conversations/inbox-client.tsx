"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, Filter, MessageSquare, Search, Shield, Tag } from "lucide-react";
import type { ConversationWorkspace } from "@/lib/conversations/types";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "active" | "negotiating" | "inspection" | "completed" | "archived";

const TABS: Array<{ id: FilterTab; label: string }> = [
  { id: "all", label: "All Deals" },
  { id: "active", label: "Active" },
  { id: "negotiating", label: "Negotiating" },
  { id: "inspection", label: "Inspection" },
  { id: "completed", label: "Completed" },
  { id: "archived", label: "Archived" },
];

export function ConversationInboxClient({
  initialConversations,
  currentUserId,
}: {
  initialConversations: ConversationWorkspace[];
  currentUserId: string;
}) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filtered = initialConversations.filter((ws) => {
    const matchesSearch =
      ws.listing.title.toLowerCase().includes(query.toLowerCase()) ||
      ws.seller.fullName.toLowerCase().includes(query.toLowerCase()) ||
      ws.listing.locationLabel.toLowerCase().includes(query.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "all") return true;
    if (activeTab === "active") return ws.status === "NEW" || ws.status === "ACTIVE" || ws.status === "VIEWING_SCHEDULED";
    if (activeTab === "negotiating") return ws.status === "NEGOTIATING" || ws.status === "OFFER_MADE" || ws.status === "OFFER_ACCEPTED";
    if (activeTab === "inspection") return ws.status === "INSPECTION_REQUESTED" || ws.status === "INSPECTION_IN_PROGRESS" || ws.status === "INSPECTION_COMPLETED";
    if (activeTab === "completed") return ws.status === "DEAL_COMPLETED";
    if (activeTab === "archived") return ws.status === "ARCHIVED" || ws.status === "DEAL_CANCELLED";

    return true;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header & Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">Inbox & Workspaces</h1>
        <p className="mt-1 text-sm text-navy/70">
          Manage your active property and vehicle transaction conversations, viewings, and offers.
        </p>
      </div>

      {/* Controls: Search & Tabs */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-navy/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by listing title, seller, or location…"
            className="w-full rounded-2xl border border-navy/10 bg-white py-3 pl-11 pr-4 text-sm font-medium text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
        </div>

        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-navy/10 bg-white p-1.5 shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pressable shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all",
                activeTab === tab.id
                  ? "bg-navy text-white shadow-sm"
                  : "text-navy/70 hover:bg-navy/5 hover:text-navy"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Cards Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-navy/10 bg-white p-12 text-center">
          <MessageSquare className="h-10 w-10 text-navy/30" />
          <h3 className="mt-3 text-base font-bold text-navy">No transactions found</h3>
          <p className="mt-1 text-xs text-navy/60">
            No active conversations match your selected tab or search query.
          </p>
          <Link
            href="/discover"
            className="mt-4 rounded-full bg-gold px-5 py-2.5 text-xs font-bold text-navy shadow-sm hover:bg-gold-light"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ws) => {
            const lastMsg = ws.messages[ws.messages.length - 1];

            return (
              <Link
                key={ws.id}
                href={`/conversations/${encodeURIComponent(ws.id)}`}
                className="group pressable block overflow-hidden rounded-3xl border border-navy/10 bg-white p-4 shadow-sm transition-all duration-200 hover:border-gold/50 hover:shadow-md sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-2xl border border-navy/10 bg-navy/5">
                      {ws.listing.imageUrl ? (
                        <Image
                          src={ws.listing.imageUrl}
                          alt={ws.listing.title}
                          fill
                          className="object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-navy/30">
                          Yike
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">
                          {ws.status.replace(/_/g, " ")}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <Shield className="h-3 w-3" /> {ws.seller.trustScore}/100
                        </span>
                      </div>

                      <h3 className="mt-1 text-base font-bold text-navy group-hover:underline">
                        {ws.listing.title}
                      </h3>

                      <p className="mt-0.5 text-xs font-semibold text-navy/70">
                        {formatPrice(ws.listing.price, "total", "rent")} · {ws.seller.fullName}
                      </p>

                      {lastMsg ? (
                        <p className="mt-2 line-clamp-1 text-xs font-medium text-navy/60">
                          <span className="font-bold text-navy">{lastMsg.senderName}:</span> {lastMsg.body}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-navy/10 pt-3 sm:border-t-0 sm:pt-0 sm:flex-col sm:items-end">
                    <span className="text-[11px] font-semibold text-navy/40">
                      {new Date(ws.lastMessageAt).toLocaleDateString()}
                    </span>

                    {ws.currentOffer ? (
                      <span className="flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-1 text-xs font-bold text-navy">
                        <Tag className="h-3 w-3" /> Offer: ₦{ws.currentOffer.amount.toLocaleString()}
                      </span>
                    ) : ws.scheduledViewingAt ? (
                      <span className="flex items-center gap-1 rounded-full bg-navy/10 px-2.5 py-1 text-xs font-bold text-navy">
                        <Calendar className="h-3 w-3" /> {ws.scheduledViewingAt}
                      </span>
                    ) : (
                      <span className="rounded-full bg-navy px-4 py-1.5 text-xs font-bold text-white shadow-sm">
                        Open Workspace
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
