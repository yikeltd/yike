"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  User,
  MessageCircle,
  Clock,
  Award,
  Lock,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import type { Property } from "@/types/database";
import { isVerifiedAgent, cn } from "@/lib/utils";
import { openWhatsAppLead, trackLeadAndRedirect } from "@/lib/leads/client";
import { useAuth } from "@/components/auth/auth-provider";
import { PropertyNegotiationModal } from "./property-negotiation-modal";

export function AgentContactCard({
  listing,
  className,
}: {
  listing: Property;
  className?: string;
}) {
  const { guardAction } = useAuth();
  const agent = listing.agent;
  const verified =
    listing.is_verified_listing || (agent ? isVerifiedAgent(agent) : false);

  const [chatLoading, setChatLoading] = useState(false);
  const [escrowNoticeOpen, setEscrowNoticeOpen] = useState(false);
  const [negotiationOpen, setNegotiationOpen] = useState(false);

  const sellerName =
    agent?.company_name || agent?.full_name || "Verified Nigerian Seller";
  const sellerAvatar = agent?.avatar_url;
  const trustScore = "4.9 ★";
  const memberSince = "Member since 2025";
  const responseTime = "Replies within 15 mins";

  const href = typeof window !== "undefined" ? window.location.pathname : `/properties/${listing.id}`;

  async function handleWhatsAppLead() {
    if (!agent?.id) return;
    setChatLoading(true);
    const result = await trackLeadAndRedirect({
      listingId: listing.id,
      agentId: agent.id,
      leadType: "whatsapp",
      sourcePage: href,
      placement: "agent_card",
      agentName: sellerName,
      title: listing.title,
      area: listing.area,
      city: listing.city,
      price: Number(listing.price),
      paymentPeriod: listing.payment_period,
      listingType: listing.listing_type,
      bedrooms: listing.bedrooms,
      propertyType: listing.property_type,
      whatsapp: agent.whatsapp,
      phone: agent.phone,
    });
    setChatLoading(false);
    if (result.ok && result.redirectUrl) {
      openWhatsAppLead(result);
    }
  }

  function onChatClick(e: React.MouseEvent) {
    e.preventDefault();
    guardAction(
      {
        type: "whatsapp",
        listingId: listing.id,
        redirectPath: href,
      },
      () => void handleWhatsAppLead()
    );
  }

  return (
    <div
      className={cn(
        "rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4 text-navy dark:text-white",
        className
      )}
    >
      {/* AGENT IDENTITY HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[#031B4E] text-white flex items-center justify-center border-2 border-gold/40 shadow-sm">
            {sellerAvatar ? (
              <Image
                src={sellerAvatar}
                alt={sellerName}
                fill
                className="object-cover"
              />
            ) : (
              <User className="h-7 w-7 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-black text-navy dark:text-white">
                {sellerName}
              </h3>
              {verified && (
                <span
                  className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-extrabold"
                  title="Identity & Business Verified"
                >
                  <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-navy/60 dark:text-white/60 mt-0.5">
              {agent?.company_name ? "Licensed Real Estate Agency" : "Property Representative"}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-navy/70 dark:text-white/70 mt-1">
              <span className="flex items-center gap-1 text-gold-dark dark:text-gold">
                <Award className="h-3.5 w-3.5" />
                {trustScore} Trust Score
              </span>
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <Clock className="h-3.5 w-3.5" />
                {responseTime}
              </span>
            </div>
          </div>
        </div>

        {agent?.id && (
          <Link
            href={`/agent/${agent.id}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-navy dark:text-white hover:bg-slate-200"
            title="View Seller Profile"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* TRUST SAFETY BANNER */}
      <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
        <Lock className="h-4 w-4 shrink-0 mt-0.5 text-gold-dark dark:text-gold" />
        <div className="space-y-0.5">
          <p className="font-bold">Yike Safe Contact Protocol</p>
          <p className="text-[10px] opacity-90">
            Phone numbers are kept private until verified lead initialization to prevent caller spam and inspection scams.
          </p>
        </div>
      </div>

      {/* PRIMARY CONTACT ACTIONS */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={onChatClick}
          disabled={chatLoading}
          className="pressable w-full flex items-center justify-center gap-2 rounded-2xl bg-[#031B4E] dark:bg-gold py-3.5 text-xs font-black text-white dark:text-navy hover:bg-navy/90 shadow-md disabled:opacity-50"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{chatLoading ? "INITIATING LEAD..." : "CONTACT ON WHATSAPP"}</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setNegotiationOpen(true)}
            className="pressable flex items-center justify-center gap-1.5 rounded-2xl border-2 border-[#031B4E] dark:border-white/20 bg-white dark:bg-transparent py-3 text-xs font-black text-navy dark:text-white hover:bg-slate-50"
          >
            <TrendingUp className="h-3.5 w-3.5 text-gold" />
            <span>Make Offer</span>
          </button>

          <button
            type="button"
            onClick={() => setEscrowNoticeOpen(true)}
            className="pressable flex items-center justify-center gap-1.5 rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 py-3 text-xs font-black text-amber-900 dark:text-amber-300 hover:bg-amber-100"
          >
            <Lock className="h-3.5 w-3.5 text-gold-dark dark:text-gold" />
            <span>Begin Escrow</span>
          </button>
        </div>
      </div>

      {/* ESCROW EXPLANATION MODAL */}
      {escrowNoticeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-navy p-6 shadow-2xl space-y-4 border border-navy/10 dark:border-white/10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-base font-black text-navy dark:text-white">
              Yike Escrow Protection Ready
            </h3>
            <p className="text-xs text-navy/80 dark:text-white/80 leading-relaxed">
              Yike Escrow keeps your deposit safe until physical inspection and tenancy/title documents are confirmed. Inform the seller via WhatsApp that you wish to use Yike Escrow.
            </p>
            <button
              type="button"
              onClick={() => setEscrowNoticeOpen(false)}
              className="w-full rounded-2xl bg-[#031B4E] py-3 text-xs font-black text-white"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* NEGOTIATION OFFER MODAL */}
      {negotiationOpen && (
        <PropertyNegotiationModal
          property={listing}
          onClose={() => setNegotiationOpen(false)}
        />
      )}
    </div>
  );
}
