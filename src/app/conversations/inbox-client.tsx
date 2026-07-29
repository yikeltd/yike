"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Search, SlidersHorizontal, Users } from "lucide-react";
import type { ConversationWorkspace } from "@/lib/conversations/types";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "unread" | "buyers" | "sellers";

export function ConversationInboxClient({
  initialConversations,
  currentUserId,
}: {
  initialConversations: ConversationWorkspace[];
  currentUserId: string;
}) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // Sample mockup dataset matching input_file_0.png exactly
  const sampleMessages = [
    {
      id: "conv-1",
      name: "John Okafor",
      role: "Buyer",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80&fit=crop",
      isOnline: true,
      message: "Hi, is this property still available for inspection?",
      time: "2m ago",
      unread: 1,
      property: {
        title: "Luxury 4 Bedroom Terrace Villa",
        price: "₦135,000,000",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=160&q=80&fit=crop",
      },
    },
    {
      id: "conv-2",
      name: "Mary James",
      role: "Buyer",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80&fit=crop",
      isOnline: true,
      message: "Thanks! When can we schedule a viewing?",
      time: "1h ago",
      unread: 2,
      property: {
        title: "Modern 3 Bedroom Apartment",
        price: "₦85,000,000",
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=160&q=80&fit=crop",
      },
    },
    {
      id: "conv-3",
      name: "Daniel Peter",
      role: "Seller",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80&fit=crop",
      isOnline: false,
      message: "Please find the documents attached.",
      time: "3h ago",
      unread: 0,
      property: null,
    },
    {
      id: "conv-4",
      name: "Linda Eze",
      role: "Buyer",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80&fit=crop",
      isOnline: true,
      message: "Can you share more photos of the kitchen?",
      time: "Yesterday",
      unread: 0,
      property: null,
    },
    {
      id: "conv-5",
      name: "Emeka Nwosu",
      role: "Seller",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&q=80&fit=crop",
      isOnline: false,
      message: "Alright, looking forward to it.",
      time: "2d ago",
      unread: 0,
      property: null,
    },
    {
      id: "conv-6",
      name: "Chief Stankings Properties",
      role: "Workspace",
      avatar: null,
      isOnline: false,
      message: "New offer: ₦130,000,000",
      time: "3d ago",
      unread: 3,
      property: null,
    },
  ];

  const filtered = sampleMessages.filter((msg) => {
    const matchesSearch =
      msg.name.toLowerCase().includes(query.toLowerCase()) ||
      msg.message.toLowerCase().includes(query.toLowerCase()) ||
      (msg.property && msg.property.title.toLowerCase().includes(query.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === "all") return true;
    if (activeTab === "unread") return msg.unread > 0;
    if (activeTab === "buyers") return msg.role === "Buyer";
    if (activeTab === "sellers") return msg.role === "Seller";

    return true;
  });

  return (
    <div className="mx-auto max-w-xl space-y-5 pb-24">
      {/* 1. Header with Filter Icon Button */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-black tracking-tight text-navy">Your Messages</h1>
        <button
          type="button"
          className="pressable flex h-10 w-10 items-center justify-center rounded-2xl border border-navy/10 bg-white text-navy shadow-xs hover:bg-surface"
          aria-label="Filter Options"
        >
          <SlidersHorizontal className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* 2. Rounded Search Field */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 h-4 w-4 text-navy/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search messages..."
          className="w-full rounded-full border border-navy/10 bg-white py-3 pl-11 pr-4 text-xs font-medium text-navy placeholder:text-navy/40 shadow-xs focus:border-gold focus:outline-none"
        />
      </div>

      {/* 3. Conversation Filters (Pills) */}
      <div className="flex items-center justify-between rounded-full border border-navy/[0.08] bg-white p-1.5 shadow-xs">
        {/* All (5) Pill */}
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={cn(
            "pressable flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all",
            activeTab === "all"
              ? "bg-[#031B4E] text-white shadow-xs"
              : "text-navy/70 hover:text-navy"
          )}
        >
          <span>All</span>
          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-black text-navy">
            5
          </span>
        </button>

        {/* Unread (2) Pill */}
        <button
          type="button"
          onClick={() => setActiveTab("unread")}
          className={cn(
            "pressable flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-all",
            activeTab === "unread"
              ? "bg-[#031B4E] text-white shadow-xs"
              : "text-navy/70 hover:text-navy"
          )}
        >
          <span>Unread</span>
          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-100 px-1 text-[10px] font-black text-amber-800">
            2
          </span>
        </button>

        {/* Buyers Pill */}
        <button
          type="button"
          onClick={() => setActiveTab("buyers")}
          className={cn(
            "pressable rounded-full px-3 py-2 text-xs font-bold transition-all",
            activeTab === "buyers"
              ? "bg-[#031B4E] text-white shadow-xs"
              : "text-navy/70 hover:text-navy"
          )}
        >
          Buyers
        </button>

        {/* Sellers Pill */}
        <button
          type="button"
          onClick={() => setActiveTab("sellers")}
          className={cn(
            "pressable rounded-full px-3 py-2 text-xs font-bold transition-all",
            activeTab === "sellers"
              ? "bg-[#031B4E] text-white shadow-xs"
              : "text-navy/70 hover:text-navy"
          )}
        >
          Sellers
        </button>
      </div>

      {/* 4. Conversation List Rows */}
      <div className="rounded-3xl border border-navy/[0.06] bg-white p-2 shadow-xs divide-y divide-navy/[0.05]">
        {filtered.map((conv) => (
          <Link
            key={conv.id}
            href={`/conversations/${conv.id}`}
            prefetch
            className="pressable group block p-3 transition-colors hover:bg-surface/60 rounded-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {/* Avatar with Presence Indicator */}
                <div className="relative shrink-0">
                  {conv.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={conv.avatar}
                      alt={conv.name}
                      className="h-11 w-11 rounded-full object-cover border border-navy/10 shadow-xs"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      <Users className="h-5 w-5" />
                    </div>
                  )}

                  {conv.isOnline && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                  )}
                </div>

                {/* Contact Name & Role Label & Message Preview */}
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xs font-black text-navy truncate">{conv.name}</h2>
                    <span className="text-[10px] font-medium text-navy/40 shrink-0">{conv.time}</span>
                  </div>

                  <p className="text-[11px] font-medium text-navy/50">{conv.role}</p>

                  <p className="text-xs font-medium text-navy/75 line-clamp-1 pt-0.5">{conv.message}</p>

                  {/* Related Property Context Card */}
                  {conv.property && (
                    <div className="mt-2.5 flex items-center gap-2.5 rounded-2xl border border-navy/[0.08] bg-surface/50 p-2">
                      <div className="relative h-10 w-12 shrink-0 overflow-hidden rounded-xl bg-navy/10">
                        <Image
                          src={conv.property.image}
                          alt={conv.property.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-[11px] font-bold text-navy truncate">{conv.property.title}</p>
                        <p className="text-[11px] font-black text-navy/80">{conv.property.price}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side Unread Badge & Chevron */}
              <div className="flex shrink-0 items-center gap-2 pt-1">
                {conv.unread > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#031B4E] text-[10px] font-black text-white shadow-xs">
                    {conv.unread}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-navy/30 group-hover:text-navy group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
