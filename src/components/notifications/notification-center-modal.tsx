"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  X,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NotificationItem = {
  id: string;
  category: "escrow" | "leads" | "trust" | "system";
  title: string;
  body: string;
  time: string;
  read: boolean;
  linkHref: string;
};

export function NotificationCenterModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState<"all" | "escrow" | "leads" | "trust">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "N1",
      category: "escrow",
      title: "Escrow Milestone Funded (10% Deposit)",
      body: "Buyer Emeka O. has funded 10% commitment deposit for 2022 Toyota Camry SE (#ESC_9814).",
      time: "10 mins ago",
      read: false,
      linkHref: "/escrow/ESC_9814",
    },
    {
      id: "N2",
      category: "leads",
      title: "New WhatsApp Inquiry Received",
      body: "Dr. Alabi K. inquired about 5 Bed Fully Detached Duplex in Lekki Phase 1.",
      time: "35 mins ago",
      read: false,
      linkHref: "/seller/crm",
    },
    {
      id: "N3",
      category: "trust",
      title: "CAC Business Verification Approved",
      body: "Your Corporate Affairs Commission status was verified by Yike Compliance Team (+20 Pts Trust Score).",
      time: "2 hours ago",
      read: true,
      linkHref: "/trust",
    },
    {
      id: "N4",
      category: "system",
      title: "Saved Search Match Alert",
      body: "3 new 4-bedroom terrace duplexes listed in Lekki Phase 1 under ₦250m.",
      time: "5 hours ago",
      read: true,
      linkHref: "/search?vertical=property&area=Lekki",
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (activeCategory !== "all" && n.category !== activeCategory) return false;
    return true;
  });

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-navy/70 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div className="flex h-full sm:h-auto max-h-[100dvh] sm:max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-none sm:rounded-3xl bg-white dark:bg-navy text-navy dark:text-white shadow-2xl border border-navy/10 dark:border-white/10 animate-in slide-in-from-right duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 px-5 py-4 bg-[#031B4E] text-white">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gold" />
            <div>
              <h2 className="text-base font-black">Marketplace Notification Center</h2>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-gold">
                  {unreadCount} unread updates
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] font-extrabold text-gold hover:underline"
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* CATEGORY TABS */}
        <div className="flex items-center gap-1.5 p-3 bg-slate-50 dark:bg-navy-light border-b border-slate-100 dark:border-white/10 text-xs font-bold overflow-x-auto">
          {(["all", "escrow", "leads", "trust"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "rounded-2xl px-3 py-1.5 capitalize shrink-0 transition-all",
                activeCategory === cat
                  ? "bg-[#031B4E] dark:bg-gold text-white dark:text-navy font-black shadow-sm"
                  : "bg-white dark:bg-white/10 text-navy dark:text-white hover:bg-slate-200"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs">
          {filtered.map((item) => {
            const Icon =
              item.category === "escrow"
                ? Lock
                : item.category === "leads"
                ? MessageCircle
                : item.category === "trust"
                ? ShieldCheck
                : Sparkles;

            return (
              <Link
                key={item.id}
                href={item.linkHref}
                onClick={onClose}
                className={cn(
                  "block p-3.5 rounded-2xl border transition-all space-y-1.5",
                  !item.read
                    ? "bg-amber-500/10 dark:bg-gold/10 border-gold/40 shadow-sm"
                    : "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-[#031B4E] text-gold shrink-0">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <h3 className="font-black text-navy dark:text-white line-clamp-1">{item.title}</h3>
                  </div>
                  <span className="text-[9px] font-semibold text-navy/50 dark:text-white/50 shrink-0">{item.time}</span>
                </div>

                <p className="text-[11px] text-navy/70 dark:text-white/70 line-clamp-2 pl-7 leading-relaxed">
                  {item.body}
                </p>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}
