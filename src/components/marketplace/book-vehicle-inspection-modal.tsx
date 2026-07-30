"use client";

import { useState } from "react";
import { X, Calendar, Clock, CheckCircle2, MessageCircle, Wrench, Car } from "lucide-react";
import type { Property } from "@/types/database";
import { formatPrice } from "@/lib/utils";
import { openWhatsAppLead, trackLeadAndRedirect } from "@/lib/leads/client";
import { useAuth } from "@/components/auth/auth-provider";

export function BookVehicleInspectionModal({
  vehicle,
  mode = "inspection",
  onClose,
}: {
  vehicle: Property;
  mode?: "inspection" | "test_drive";
  onClose: () => void;
}) {
  const { guardAction } = useAuth();
  const isTestDrive = mode === "test_drive";
  const [preferredDate, setPreferredDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
  );
  const [preferredTime, setPreferredTime] = useState("11:00 AM");
  const [loading, setLoading] = useState(false);

  const priceFormatted = formatPrice(Number(vehicle.price));
  const sellerName = vehicle.agent?.company_name || vehicle.agent?.full_name || "Verified Dealer";

  async function submitBooking() {
    if (!vehicle.agent?.id) return;
    setLoading(true);

    const bookingType = isTestDrive ? "Test Drive Appointment" : "150-Point Physical Inspection";
    const message = `Hello ${sellerName}, I would like to book a ${bookingType} for the ${vehicle.year || ""} ${vehicle.title} (₦${priceFormatted}) on ${preferredDate} at ${preferredTime}. Please confirm availability.`;

    const href = typeof window !== "undefined" ? window.location.pathname : `/vehicles/${vehicle.id}`;
    const result = await trackLeadAndRedirect({
      listingId: vehicle.id,
      agentId: vehicle.agent.id,
      leadType: "whatsapp",
      sourcePage: href,
      placement: "detail",
      agentName: sellerName,
      title: vehicle.title,
      area: vehicle.area,
      city: vehicle.city,
      price: Number(vehicle.price),
      paymentPeriod: vehicle.payment_period || "total",
      listingType: vehicle.listing_type || "sale",
      bedrooms: vehicle.bedrooms,
      propertyType: vehicle.auto_category,
      whatsapp: vehicle.agent.whatsapp,
      phone: vehicle.agent.phone,
    });

    setLoading(false);
    onClose();

    if (result.ok && result.redirectUrl) {
      const customUrl = `${result.redirectUrl}&text=${encodeURIComponent(message)}`;
      window.open(customUrl, "_blank", "noopener,noreferrer");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    guardAction(
      {
        type: "whatsapp",
        listingId: vehicle.id,
        redirectPath: `/vehicles/${vehicle.id}`,
      },
      () => void submitBooking()
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-navy p-6 shadow-2xl space-y-4 border border-navy/10 dark:border-white/10 text-navy dark:text-white animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-gold">
              {isTestDrive ? <Car className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
            </span>
            <div>
              <h3 className="text-base font-black">
                {isTestDrive ? "Book Test Drive" : "Book 150-Pt Inspection"}
              </h3>
              <p className="text-[10px] font-semibold text-navy/50 dark:text-white/50">
                Direct booking with {sellerName}
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

        <div className="rounded-2xl bg-slate-50 dark:bg-white/5 p-3.5 space-y-1 text-xs">
          <p className="font-black text-navy dark:text-white line-clamp-1">
            {vehicle.title}
          </p>
          <p className="text-sm font-black text-gold-dark dark:text-gold">
            {priceFormatted}
          </p>
          <p className="text-[10px] font-semibold text-navy/60 dark:text-white/60">
            Location: {[vehicle.area, vehicle.city].filter(Boolean).join(", ")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-navy/70 dark:text-white/70 block flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-gold" />
                Preferred Date
              </label>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full rounded-2xl border border-navy/20 dark:border-white/20 bg-white dark:bg-navy-light px-3 py-2.5 text-xs font-bold text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-navy/70 dark:text-white/70 block flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-gold" />
                Preferred Time
              </label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full rounded-2xl border border-navy/20 dark:border-white/20 bg-white dark:bg-navy-light px-3 py-2.5 text-xs font-bold text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="10:00 AM">10:00 AM Morning</option>
                <option value="12:00 PM">12:00 PM Noon</option>
                <option value="02:00 PM">02:00 PM Afternoon</option>
                <option value="04:00 PM">04:00 PM Evening</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-3 text-[11px] font-medium text-emerald-900 dark:text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {isTestDrive
                ? "Dealer will verify valid driver's license prior to showroom test drive."
                : "A certified Yike Auto mechanic will accompany you to verify engine OBD2 codes and chassis integrity."}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="pressable w-full flex items-center justify-center gap-2 rounded-2xl bg-[#031B4E] dark:bg-gold py-3.5 text-xs font-black text-white dark:text-navy hover:bg-navy/90 shadow-md disabled:opacity-50"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{loading ? "CONFIRMING..." : "CONFIRM VIA WHATSAPP"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
