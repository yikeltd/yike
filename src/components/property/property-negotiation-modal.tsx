"use client";

import { useState } from "react";
import { X, TrendingUp, MessageCircle } from "lucide-react";
import type { Property } from "@/types/database";
import { formatPrice } from "@/lib/utils";
import { openWhatsAppLead, trackLeadAndRedirect } from "@/lib/leads/client";
import { useAuth } from "@/components/auth/auth-provider";

export function PropertyNegotiationModal({
  property,
  onClose,
}: {
  property: Property;
  onClose: () => void;
}) {
  const { guardAction } = useAuth();
  const listingPrice = Number(property.price);
  const [offerPrice, setOfferPrice] = useState<string>(
    Math.round(listingPrice * 0.9).toString()
  );
  const [paymentTerms, setPaymentTerms] = useState("Upfront Annual");
  const [loading, setLoading] = useState(false);

  const formattedAsking = formatPrice(
    listingPrice,
    property.payment_period,
    property.listing_type
  );

  async function submitOffer() {
    if (!property.agent?.id) return;
    setLoading(true);

    const offerAmount = Number(offerPrice) || listingPrice;
    const formattedOffer = formatPrice(offerAmount);
    const offerMessage = `Hello ${property.agent.full_name || "Seller"}, I would like to make an offer of ${formattedOffer} (${paymentTerms}) for your property "${property.title}" listed on Yike. Is this price acceptable?`;

    const href = typeof window !== "undefined" ? window.location.pathname : `/properties/${property.id}`;
    const result = await trackLeadAndRedirect({
      listingId: property.id,
      agentId: property.agent.id,
      leadType: "whatsapp",
      sourcePage: href,
      placement: "detail",
      agentName: property.agent.full_name ?? "Agent",
      title: property.title,
      area: property.area,
      city: property.city,
      price: offerAmount,
      paymentPeriod: property.payment_period,
      listingType: property.listing_type,
      bedrooms: property.bedrooms,
      propertyType: property.property_type,
      whatsapp: property.agent.whatsapp,
      phone: property.agent.phone,
    });

    setLoading(false);
    onClose();

    if (result.ok && result.redirectUrl) {
      // Append pre-filled offer message to WhatsApp URL
      const customUrl = `${result.redirectUrl}&text=${encodeURIComponent(offerMessage)}`;
      window.open(customUrl, "_blank", "noopener,noreferrer");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    guardAction(
      {
        type: "whatsapp",
        listingId: property.id,
        redirectPath: `/properties/${property.id}`,
      },
      () => void submitOffer()
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-navy p-6 shadow-2xl space-y-4 border border-navy/10 dark:border-white/10 text-navy dark:text-white animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-gold">
              <TrendingUp className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-black">Make Price Offer</h3>
              <p className="text-[10px] font-semibold text-navy/50 dark:text-white/50">
                Direct negotiation via WhatsApp Lead
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-navy dark:text-white hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-2xl bg-slate-50 dark:bg-white/5 p-3 space-y-1 text-xs">
          <p className="text-[10px] font-bold text-navy/50 dark:text-white/50 uppercase">
            Property Asking Price
          </p>
          <p className="text-lg font-black text-gold-dark dark:text-gold">
            {formattedAsking}
          </p>
          <p className="text-[11px] font-medium text-navy/70 dark:text-white/70 truncate">
            {property.title}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-navy/70 dark:text-white/70 block">
              Your Offer Price (₦)
            </label>
            <input
              type="number"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              placeholder="Enter your offer amount"
              className="w-full rounded-2xl border border-navy/20 dark:border-white/20 bg-white dark:bg-navy-light px-4 py-3 text-sm font-bold text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-navy/70 dark:text-white/70 block">
              Preferred Payment Term
            </label>
            <select
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full rounded-2xl border border-navy/20 dark:border-white/20 bg-white dark:bg-navy-light px-4 py-3 text-xs font-bold text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="Upfront Annual">Upfront 1 Year Rent / Full Outright</option>
              <option value="Bi-Annual">2-Year Advance Commitment</option>
              <option value="Flexible Plan">Flexible Installment Plan</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="pressable w-full flex items-center justify-center gap-2 rounded-2xl bg-[#031B4E] dark:bg-gold py-3.5 text-xs font-black text-white dark:text-navy hover:bg-navy/90 shadow-md disabled:opacity-50"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{loading ? "SENDING OFFER..." : "SEND OFFER VIA WHATSAPP"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
