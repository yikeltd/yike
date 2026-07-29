"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Advertisement } from "@/types/database";
import {
  ADVERTISEMENT_PLACEMENTS,
  ADVERTISEMENT_PRICING,
  type AdvertisementDurationPlan,
  type AdvertisementPlacement,
} from "@/lib/advertisements/constants";
import { formatPrice, cn } from "@/lib/utils";
import {
  Sparkles,
  Rocket,
  CreditCard,
  CheckCircle2,
  Clock,
  Eye,
  MousePointerClick,
  TrendingUp,
  RefreshCw,
  Copy,
  Archive,
  Plus,
  Lock,
} from "lucide-react";

type CampaignItem = Advertisement & {
  metrics?: { impressions: number; clicks: number; ctr: number };
};

export function SellerPromotionsHub({ userId }: { userId: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<"active" | "pending" | "scheduled" | "expired">("active");
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [placement, setPlacement] = useState<AdvertisementPlacement>("HOME_HERO");
  const [durationPlan, setDurationPlan] = useState<AdvertisementDurationPlan>("week");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<"paystack" | "korapay">("paystack");
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/advertisements?status=${tab}`);
      const data = await res.json();
      if (res.ok && data.advertisements) {
        setCampaigns(data.advertisements);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  async function handleCreateAndPay() {
    if (!title.trim()) {
      setErrorMessage("Campaign title is required.");
      return;
    }
    if (!imageUrl.trim()) {
      setErrorMessage("Creative image URL is required.");
      return;
    }
    if (!destinationUrl.trim()) {
      setErrorMessage("Destination link is required.");
      return;
    }

    setErrorMessage(null);
    setCreating(true);

    try {
      // 1. Create draft ad record
      const price = ADVERTISEMENT_PRICING[placement]?.[durationPlan] ?? 20000;
      const createRes = await fetch("/api/admin/advertisements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          advertiserName: "Seller Campaign",
          destinationUrl,
          placement,
          durationPlan,
          imageUrl,
          amount: price,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok || !createData.ok || !createData.advertisement?.id) {
        setErrorMessage(createData.error || "Failed to create campaign record.");
        setCreating(false);
        return;
      }

      const adId = createData.advertisement.id as string;

      // 2. Initialize payment with selected provider
      const checkoutRes = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode: "advertisement",
          billingMonths: durationPlan === "month" ? 1 : 1,
          provider: selectedProvider,
          entityId: adId,
        }),
      });

      const checkoutData = await checkoutRes.json();

      if (checkoutData.authorizationUrl) {
        window.open(checkoutData.authorizationUrl, "_blank");
        setShowCreateModal(false);
        void loadCampaigns();
      } else if (!checkoutData.paymentsLive) {
        // Staging auto-activation
        await fetch(`/api/admin/advertisements/${adId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "activate_waived" }),
        });
        setShowCreateModal(false);
        void loadCampaigns();
      } else {
        setErrorMessage(checkoutData.error || "Could not start payment.");
      }
    } catch {
      setErrorMessage("Network error initializing promotion payment.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRenew(id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/admin/advertisements/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout" }),
      });
      void loadCampaigns();
    } catch {
      /* ignore */
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6 text-navy">
      {/* HEADER BAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-navy p-6 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" />
            <h1 className="text-xl font-black">Promotions & Advertising</h1>
          </div>
          <p className="text-xs text-white/70">
            Boost listing visibility, launch spotlight banners, and reach high-intent buyers across Nigeria.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="pressable flex items-center justify-center gap-2 rounded-2xl bg-gold px-5 py-3 text-xs font-black text-navy shadow-md hover:bg-gold-light shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>NEW CAMPAIGN</span>
        </button>
      </div>

      {/* METRICS HIGHLIGHTS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border/60 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase text-navy/50 block">Active Campaigns</span>
          <span className="text-xl font-black text-navy mt-1 block">
            {campaigns.filter((c) => c.status === "active" || c.status === "live").length}
          </span>
        </div>

        <div className="rounded-2xl border border-border/60 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase text-navy/50 block">Total Impressions</span>
          <span className="text-xl font-black text-navy mt-1 block">
            {campaigns.reduce((acc, c) => acc + (c.metrics?.impressions ?? 0), 0).toLocaleString()}
          </span>
        </div>

        <div className="rounded-2xl border border-border/60 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase text-navy/50 block">Total Clicks</span>
          <span className="text-xl font-black text-navy mt-1 block">
            {campaigns.reduce((acc, c) => acc + (c.metrics?.clicks ?? 0), 0).toLocaleString()}
          </span>
        </div>

        <div className="rounded-2xl border border-border/60 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase text-navy/50 block">Average CTR</span>
          <span className="text-xl font-black text-gold-dark mt-1 block">
            {campaigns.length
              ? (
                  campaigns.reduce((acc, c) => acc + (c.metrics?.ctr ?? 0), 0) / campaigns.length
                ).toFixed(1)
              : "0.0"}
            %
          </span>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {(["active", "pending", "scheduled", "expired"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all",
              tab === t
                ? "bg-navy text-white font-black shadow-xs"
                : "bg-slate-100 text-navy/70 hover:bg-slate-200"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* CAMPAIGNS LIST */}
      {loading ? (
        <div className="p-8 text-center text-xs font-bold text-navy/50">Loading campaigns…</div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-white p-8 text-center space-y-3">
          <Rocket className="mx-auto h-8 w-8 text-navy/40" />
          <h3 className="text-sm font-bold text-navy">No {tab} campaigns found</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Launch a Hero Spotlight, Category Banner, or Listing Boost to accelerate inquiries.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="pressable inline-flex items-center gap-2 rounded-2xl bg-gold px-4 py-2.5 text-xs font-black text-navy shadow-xs"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Create First Campaign</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {campaigns.map((c) => (
            <div key={c.id} className="rounded-3xl border border-border/60 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-black text-navy text-sm">{c.title}</h4>
                  <span className="text-[10px] font-bold text-navy/60">
                    {ADVERTISEMENT_PLACEMENTS[c.placement]?.label ?? c.placement}
                  </span>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
                    c.status === "active" || c.status === "live"
                      ? "bg-emerald-100 text-emerald-800"
                      : c.status === "pending_approval" || c.status === "pending"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-700"
                  )}
                >
                  {c.status}
                </span>
              </div>

              {c.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.image_url}
                  alt={c.title}
                  className="h-24 w-full rounded-2xl object-cover border border-slate-100"
                />
              )}

              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl text-center text-[10px]">
                <div>
                  <span className="text-navy/50 font-medium block">Impressions</span>
                  <span className="font-bold text-navy block">{c.metrics?.impressions ?? 0}</span>
                </div>
                <div>
                  <span className="text-navy/50 font-medium block">Clicks</span>
                  <span className="font-bold text-navy block">{c.metrics?.clicks ?? 0}</span>
                </div>
                <div>
                  <span className="text-navy/50 font-medium block">CTR</span>
                  <span className="font-black text-gold-dark block">{c.metrics?.ctr ?? 0}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  disabled={busyId === c.id}
                  onClick={() => handleRenew(c.id)}
                  className="pressable flex items-center gap-1.5 font-bold text-navy hover:underline"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Renew / Extend</span>
                </button>

                <span className="text-[10px] font-bold text-navy/40">
                  {c.expires_at ? `Expires ${new Date(c.expires_at).toLocaleDateString()}` : "No expiry"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE CAMPAIGN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 text-navy max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black uppercase text-navy">New Self-Service Campaign</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-navy/50 hover:text-navy font-bold"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-900">
                {errorMessage}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-navy/70 block mb-1">Campaign Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lekki Luxury Villa Banner"
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-navy"
                />
              </div>

              <div>
                <label className="font-bold text-navy/70 block mb-1">Placement Product *</label>
                <select
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value as AdvertisementPlacement)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-navy"
                >
                  <option value="HOME_HERO">Hero Spotlight (Top Homepage Billboard)</option>
                  <option value="HOME_SECTION">Homepage Section Spotlight</option>
                  <option value="VEHICLE_CATEGORY">Vehicle Category Header</option>
                  <option value="PROPERTY_CATEGORY">Property Category Header</option>
                  <option value="SEARCH_INLINE">Search In-Feed Card</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-navy/70 block mb-1">Duration *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDurationPlan("week")}
                    className={cn(
                      "p-2.5 rounded-xl border font-bold text-center",
                      durationPlan === "week"
                        ? "border-navy bg-navy/5 font-black"
                        : "border-slate-200 bg-slate-50"
                    )}
                  >
                    1 Week (7 Days)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationPlan("month")}
                    className={cn(
                      "p-2.5 rounded-xl border font-bold text-center",
                      durationPlan === "month"
                        ? "border-navy bg-navy/5 font-black"
                        : "border-slate-200 bg-slate-50"
                    )}
                  >
                    1 Month (30 Days)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-navy/70 block mb-1">Creative Image URL *</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://yike.ng/images/banner.webp"
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-navy"
                />
              </div>

              <div>
                <label className="font-bold text-navy/70 block mb-1">Click Destination Link *</label>
                <input
                  type="text"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="/properties/lekki-villa or https://..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-navy"
                />
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="font-bold text-navy/70 block">Payment Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProvider("paystack")}
                    className={cn(
                      "p-2.5 rounded-xl border text-center font-bold",
                      selectedProvider === "paystack" ? "border-navy bg-navy/5" : "border-slate-200"
                    )}
                  >
                    Paystack
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProvider("korapay")}
                    className={cn(
                      "p-2.5 rounded-xl border text-center font-bold",
                      selectedProvider === "korapay" ? "border-navy bg-navy/5" : "border-slate-200"
                    )}
                  >
                    Korapay
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={creating}
              onClick={handleCreateAndPay}
              className="pressable flex w-full items-center justify-center gap-2 rounded-2xl bg-gold py-3.5 text-xs font-black text-navy shadow-md hover:bg-gold-light disabled:opacity-70"
            >
              <CreditCard className="h-4 w-4" />
              <span>
                {creating
                  ? "Initializing Checkout…"
                  : `Pay & Submit (₦${(ADVERTISEMENT_PRICING[placement]?.[durationPlan] ?? 20000).toLocaleString()})`}
              </span>
            </button>

            <p className="text-center text-[10px] font-bold text-navy/50 flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" />
              <span>Verified server-side payment via {selectedProvider}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
