"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  UserCheck,
  Building2,
  CheckCircle2,
  Award,
  Zap,
  Lock,
  ChevronLeft,
  Share2,
  Info,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Car,
  Home,
  Check,
  Sparkles,
} from "lucide-react";
import type { TrustIdentity } from "@/lib/identity/types";
import { formatPrice, cn } from "@/lib/utils";
import { TrustScoreExplanationModal } from "./trust-score-explanation-modal";
import { PropertyCard } from "@/components/property/property-card";
import type { Property } from "@/types/database";

export function TrustPassportExperience({
  passport,
  userListings = [],
}: {
  passport: TrustIdentity;
  userListings?: Property[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const reputation = passport.reputation;
  const score = passport.trustScore;
  const level = passport.trustLevel;

  const timelineSteps = [
    { title: "NIN Identity Verified", date: "Jul 2026", done: true },
    { title: "CAC Business Registration", date: "Jul 2026", done: true },
    { title: "Physical Field Inspection", date: "Jul 2026", done: true },
    { title: "Yike Auto Escrow Active", date: "Live", done: true },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white pb-20 select-none">
      
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-navy/10 dark:border-white/10 bg-[#031B4E] px-4 py-3 text-white shadow-md">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xs font-black uppercase tracking-wider text-gold flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-gold" />
          UNIVERSAL TRUST PASSPORT
        </h1>
        <button
          type="button"
          onClick={() => {
            if (navigator.share) {
              void navigator.share({
                title: `${passport.fullName}'s Trust Passport`,
                url: window.location.href,
              });
            }
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </header>

      <div className="mx-auto max-w-5xl px-3.5 pt-6 sm:px-6 space-y-6">
        
        {/* 1. HERO MERCHANT HEADER */}
        <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-3xl bg-[#031B4E] text-white flex items-center justify-center border-2 border-gold/40 shadow-lg">
                {passport.avatarUrl ? (
                  <Image src={passport.avatarUrl} alt={passport.fullName} fill className="object-cover" />
                ) : (
                  <span className="text-2xl font-black">{passport.fullName.slice(0, 1)}</span>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-navy dark:text-white leading-tight">
                    {passport.fullName}
                  </h2>
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-3 py-0.5 text-xs font-extrabold flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified Merchant
                  </span>
                </div>

                <p className="text-xs font-semibold text-navy/60 dark:text-white/60 mt-1 capitalize">
                  {passport.profileType} Merchant · Member since {passport.memberSince}
                </p>

                <div className="flex flex-wrap gap-3 text-xs font-bold text-navy/70 dark:text-white/70 mt-2">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-gold" />
                    Verified Phone
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-gold" />
                    Verified Email
                  </span>
                </div>
              </div>
            </div>

            {/* TRUST GAUGE CARD */}
            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-[#031B4E] to-navy-light text-white shadow-md">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gold block">
                  Trust Reputation
                </span>
                <span className="text-sm font-black capitalize text-white">
                  {level} Tier
                </span>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1 rounded-2xl bg-gold text-navy px-3.5 py-2 text-xs font-black shadow-md hover:bg-gold-light"
              >
                <span className="text-base">{score}</span>
                <span className="text-[10px]">/ 100</span>
                <Info className="h-3.5 w-3.5 ml-1" />
              </button>
            </div>
          </div>

          {/* VERIFICATION BADGES SHOWCASE */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
            {passport.badges.map((b) => (
              <span
                key={b.id}
                className="pressable inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-black text-emerald-900 dark:text-emerald-300"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{b.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* 2. VERIFICATION TIMELINE & AUDIT HISTORY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: TIMELINE */}
          <div className="lg:col-span-6 rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-navy/70 dark:text-white/70 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-gold" />
              Verification Timeline Progress
            </h3>

            <div className="relative space-y-4 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-500/30">
              {timelineSteps.map((step, idx) => (
                <div key={idx} className="relative flex items-center gap-3 pl-8">
                  <span className="absolute left-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white text-[9px] font-black">
                    ✓
                  </span>
                  <div>
                    <p className="text-xs font-black text-navy dark:text-white">{step.title}</p>
                    <p className="text-[10px] font-semibold text-navy/50 dark:text-white/50">{step.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: REPUTATION METRICS */}
          <div className="lg:col-span-6 rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-navy/70 dark:text-white/70 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-gold" />
              Marketplace Reputation & Performance
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                <span className="text-[10px] font-semibold text-navy/50 dark:text-white/50 block">Completed Deals</span>
                <span className="text-lg font-black text-navy dark:text-white mt-0.5 block">{reputation.completedDeals}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                <span className="text-[10px] font-semibold text-navy/50 dark:text-white/50 block">Response Rate</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{reputation.responseRatePercentage}%</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                <span className="text-[10px] font-semibold text-navy/50 dark:text-white/50 block">Avg Response Speed</span>
                <span className="text-lg font-black text-navy dark:text-white mt-0.5 block">{reputation.averageResponseTimeMinutes} Mins</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                <span className="text-[10px] font-semibold text-navy/50 dark:text-white/50 block">Buyer Rating</span>
                <span className="text-lg font-black text-gold-dark dark:text-gold mt-0.5 block">{reputation.averageRating.toFixed(1)} ★</span>
              </div>
            </div>
          </div>

        </div>

        {/* 3. ACTIVE INVENTORY */}
        {userListings.length > 0 && (
          <div className="space-y-3 pt-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white">
              Active Verified Inventory ({userListings.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {userListings.map((p) => (
                <PropertyCard key={p.id} property={p} layout="desktop" />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* EXPLANATION MODAL */}
      {modalOpen && (
        <TrustScoreExplanationModal
          score={score}
          level={level}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
