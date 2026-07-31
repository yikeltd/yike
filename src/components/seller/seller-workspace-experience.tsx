"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  PlusCircle,
  MessageCircle,
  Lock,
  Clock,
  Home,
} from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";

export function SellerWorkspaceExperience() {
  const merchantName = "Chief Stankings Properties & Auto";
  const trustScore = 95;
  const trustLevel = "platinum";
  const memberSince = "2026";

  const stats = [
    { label: "Active Inventory", value: "24", sub: "16 Houses · 8 Vehicles", icon: Home, color: "bg-blue-500/10 text-blue-600" },
    { label: "Inbound Leads (30d)", value: "142", sub: "92 WhatsApp · 50 Calls", icon: MessageCircle, color: "bg-[#031B4E] text-gold" },
    { label: "Escrow Deals Active", value: "₦48.5M", sub: "3 Transactions in progress", icon: Lock, color: "bg-emerald-500/10 text-emerald-600" },
    { label: "Avg Response Speed", value: "<14 Mins", sub: "98% Response rate (Top 2%)", icon: Clock, color: "bg-amber-500/10 text-amber-600" },
  ];

  const recentLeads = [
    { id: "L1", buyer: "Dr. Alabi K.", item: "5 Bed Fully Detached Duplex (Lekki Phase 1)", type: "Property", status: "Inspection Booked", time: "25 mins ago", price: "₦350,000,000" },
    { id: "L2", buyer: "Emeka O.", item: "2022 Toyota Camry SE (Tokunbo)", type: "Vehicle", status: "Offer Received", time: "1 hour ago", price: "₦18,500,000" },
    { id: "L3", buyer: "Mrs. Folake A.", item: "4 Bed Terrace (Ikoyi)", type: "Property", status: "Escrow Started", time: "3 hours ago", price: "₦280,000,000" },
  ];

  const activeEscrows = [
    { id: "ESC_9814", buyer: "Emeka O.", asset: "2022 Toyota Camry SE", status: "Physical Inspection (Step 3/7)", milestone: "10% Deposit Funded", amount: 18500000 },
    { id: "ESC_9810", buyer: "Mrs. Folake A.", asset: "4 Bed Terrace (Ikoyi)", status: "Title Audit (Step 4/7)", milestone: "40% Inspection Release Funded", amount: 280000000 },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white pb-20 select-none">
      
      {/* TOP SELLER HEADER */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-navy/10 dark:border-white/10 bg-[#031B4E] px-4 py-3 text-white shadow-md">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-xl bg-gold text-navy font-black">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xs font-black uppercase tracking-wider text-gold">
              MERCHANT BUSINESS WORKSPACE
            </h1>
            <p className="text-[10px] font-semibold text-white/70">
              Yike Professional Seller Suite v1.6
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/post-property"
            className="flex items-center gap-1 rounded-2xl bg-gold text-navy px-3.5 py-1.5 text-xs font-black shadow-md hover:bg-gold-light"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Post Listing</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-3.5 pt-6 sm:px-6 space-y-6">
        
        {/* 1. MERCHANT BRAND HERO CARD */}
        <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#031B4E] text-white flex items-center justify-center border-2 border-gold/40 shadow-md">
                <Image src="/images/logo.webp" alt="Merchant Avatar" fill className="object-cover" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-navy dark:text-white">
                    {merchantName}
                  </h2>
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-3 py-0.5 text-xs font-extrabold flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    CAC & NIN Verified
                  </span>
                </div>

                <p className="text-xs font-semibold text-navy/60 dark:text-white/60 mt-0.5">
                  Verified Real Estate & Automotive Merchant · Member since {memberSince}
                </p>
              </div>
            </div>

            {/* TRUST GAUGE CARD */}
            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 p-3 rounded-2xl bg-gradient-to-br from-[#031B4E] to-navy-light text-white shadow-md">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-gold block">
                  Trust Reputation
                </span>
                <span className="text-xs font-black capitalize text-white">
                  {trustLevel} Merchant Tier
                </span>
              </div>

              <Link
                href="/trust"
                className="flex items-center gap-1 rounded-xl bg-gold text-navy px-3 py-1.5 text-xs font-black shadow-sm"
              >
                <span>{trustScore}</span>
                <span className="text-[9px]">/ 100</span>
              </Link>
            </div>
          </div>

          {/* SELLER NAVIGATION TABS */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-white/10 text-xs font-bold">
            <Link href="/seller" className="rounded-2xl bg-[#031B4E] dark:bg-gold px-4 py-2 text-white dark:text-navy font-black shadow-sm">
              Overview
            </Link>
            <Link href="/seller/listings" className="rounded-2xl bg-slate-100 dark:bg-white/10 px-4 py-2 text-navy dark:text-white hover:bg-slate-200">
              Listings (24)
            </Link>
            <Link href="/seller/crm" className="rounded-2xl bg-slate-100 dark:bg-white/10 px-4 py-2 text-navy dark:text-white hover:bg-slate-200">
              Leads CRM (142)
            </Link>
            <Link href="/seller/transactions" className="rounded-2xl bg-slate-100 dark:bg-white/10 px-4 py-2 text-navy dark:text-white hover:bg-slate-200">
              Escrow Queue (3)
            </Link>
            <Link href="/seller/analytics" className="rounded-2xl bg-slate-100 dark:bg-white/10 px-4 py-2 text-navy dark:text-white hover:bg-slate-200">
              Analytics
            </Link>
          </div>
        </div>

        {/* 2. STATS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy shadow-md space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-navy/50 dark:text-white/50">
                    {s.label}
                  </span>
                  <span className={cn("p-2 rounded-xl", s.color)}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-navy dark:text-white tracking-tight">
                  {s.value}
                </p>
                <p className="text-[10px] font-semibold text-navy/60 dark:text-white/60">
                  {s.sub}
                </p>
              </div>
            );
          })}
        </div>

        {/* 3. RECENT INBOUND LEADS & ESCROW QUEUE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: INBOUND LEADS */}
          <div className="lg:col-span-7 rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-navy/70 dark:text-white/70 flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4 text-gold" />
                Inbound Inquiries & Lead Pipeline
              </h3>
              <Link href="/seller/crm" className="text-xs font-bold text-gold-dark dark:text-gold hover:underline">
                View All Leads
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              {recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-navy dark:text-white">{lead.buyer}</span>
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-extrabold">
                      {lead.status}
                    </span>
                  </div>

                  <p className="text-[11px] font-bold text-navy/80 dark:text-white/80 line-clamp-1">{lead.item}</p>

                  <div className="flex items-center justify-between text-[10px] text-navy/50 dark:text-white/50 pt-1 border-t border-slate-200 dark:border-white/10">
                    <span className="font-black text-gold-dark dark:text-gold">{lead.price}</span>
                    <span>{lead.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: ESCROW TRANSACTIONS QUEUE */}
          <div className="lg:col-span-5 rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-navy/70 dark:text-white/70 flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-gold" />
                Escrow Deals Queue
              </h3>
              <Link href="/seller/transactions" className="text-xs font-bold text-gold-dark dark:text-gold hover:underline">
                Manage Escrow
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              {activeEscrows.map((escrow) => (
                <Link
                  key={escrow.id}
                  href={`/escrow/${escrow.id}`}
                  className="block p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-gold transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-navy dark:text-white">#{escrow.id}</span>
                    <span className="font-black text-gold-dark dark:text-gold">{formatPrice(escrow.amount)}</span>
                  </div>

                  <p className="text-[11px] font-extrabold text-navy dark:text-white line-clamp-1">{escrow.asset}</p>

                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 text-[10px] font-bold">
                    {escrow.status}
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
