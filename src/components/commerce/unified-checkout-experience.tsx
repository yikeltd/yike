"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard, Lock, ShieldCheck, Building2, CheckCircle2, ArrowRight, Copy } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";

export function UnifiedCheckoutExperience({
  title = "7-Day Featured Listing Boost",
  amount = 5000,
}: {
  title?: string;
  amount?: number;
  itemType?: "boost" | "subscription" | "verification" | "escrow";
}) {
  const [selectedProvider, setSelectedProvider] = useState<"paystack" | "korapay" | "safehaven">("paystack");
  const [copied, setCopied] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const vat = Math.round(amount * 0.075);
  const total = amount + vat;

  function handlePay() {
    setIsSuccess(true);
  }

  function handleCopyBank() {
    navigator.clipboard.writeText("9982481029");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white p-4 sm:p-6 flex items-center justify-center select-none">
      
      <div className="w-full max-w-xl rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-2xl space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#031B4E] text-gold">
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base font-black uppercase tracking-wider text-navy dark:text-white">
                Yike Secure Checkout
              </h1>
              <p className="text-[11px] font-semibold text-navy/60 dark:text-white/60">
                256-Bit SSL Encrypted Transaction Vault
              </p>
            </div>
          </div>

          <span className="rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1 text-[10px] font-black uppercase flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified
          </span>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-xl font-black text-navy dark:text-white">Payment Confirmed!</h2>
              <p className="text-xs text-navy/70 dark:text-white/70 mt-1">
                Your payment of {formatPrice(total)} for &quot;{title}&quot; was successfully processed. Receipt sent to your email.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3 font-bold text-xs">
              <Link href="/seller" className="rounded-2xl bg-[#031B4E] text-gold px-5 py-2.5 hover:bg-navy-light">
                Return to Seller Dashboard
              </Link>
              <Link href="/account/billing" className="rounded-2xl bg-slate-100 dark:bg-white/10 text-navy dark:text-white px-5 py-2.5">
                View Receipt
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* ORDER SUMMARY */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between font-black text-navy dark:text-white text-sm">
                <span>{title}</span>
                <span>{formatPrice(amount)}</span>
              </div>

              <div className="space-y-1 text-[11px] text-navy/70 dark:text-white/70 pt-2 border-t border-slate-200 dark:border-white/10">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>7.5% Statutory VAT</span>
                  <span>{formatPrice(vat)}</span>
                </div>
                <div className="flex justify-between font-black text-navy dark:text-white text-xs pt-1">
                  <span>Total Amount Due</span>
                  <span className="text-gold-dark dark:text-gold text-sm">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* PAYMENT PROVIDER SELECTOR */}
            <div className="space-y-3 text-xs">
              <label className="font-black uppercase tracking-wider text-navy/60 dark:text-white/60 text-[10px] block">
                Select Payment Channel
              </label>

              <div className="grid grid-cols-3 gap-2 font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedProvider("paystack")}
                  className={cn(
                    "p-3 rounded-2xl border transition-all text-center space-y-1",
                    selectedProvider === "paystack"
                      ? "border-gold bg-gold/10 text-navy dark:text-gold font-black shadow-sm"
                      : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
                  )}
                >
                  <CreditCard className="h-4 w-4 mx-auto text-blue-600" />
                  <span className="block text-[11px]">Paystack</span>
                  <span className="block text-[9px] text-navy/50 dark:text-white/50 font-normal">Card / USSD</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProvider("korapay")}
                  className={cn(
                    "p-3 rounded-2xl border transition-all text-center space-y-1",
                    selectedProvider === "korapay"
                      ? "border-gold bg-gold/10 text-navy dark:text-gold font-black shadow-sm"
                      : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
                  )}
                >
                  <CreditCard className="h-4 w-4 mx-auto text-emerald-600" />
                  <span className="block text-[11px]">Korapay</span>
                  <span className="block text-[9px] text-navy/50 dark:text-white/50 font-normal">Card / Bank</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProvider("safehaven")}
                  className={cn(
                    "p-3 rounded-2xl border transition-all text-center space-y-1",
                    selectedProvider === "safehaven"
                      ? "border-gold bg-gold/10 text-navy dark:text-gold font-black shadow-sm"
                      : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
                  )}
                >
                  <Building2 className="h-4 w-4 mx-auto text-gold" />
                  <span className="block text-[11px]">SafeHaven</span>
                  <span className="block text-[9px] text-navy/50 dark:text-white/50 font-normal">Dedicated Transfer</span>
                </button>
              </div>
            </div>

            {/* SAFEHAVEN VIRTUAL BANK ACCOUNT DETAILS */}
            {selectedProvider === "safehaven" && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-gold/40 text-xs space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="font-black text-navy dark:text-gold">SafeHaven Virtual Account</span>
                  <span className="text-[10px] font-bold text-navy/60 dark:text-white/60">Instant Auto-Confirmation</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-navy/50 dark:text-white/50">Bank: SafeHaven MFB</p>
                    <p className="font-black text-sm text-navy dark:text-white tracking-widest">9982481029</p>
                    <p className="text-[10px] text-navy/70 dark:text-white/70">Account: Yike Escrow Vault (#CHK_901)</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyBank}
                    className="p-2 rounded-xl bg-gold/20 text-navy dark:text-gold hover:bg-gold/30 font-bold flex items-center gap-1 text-[11px]"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* PAY BUTTON */}
            <button
              type="button"
              onClick={handlePay}
              className="pressable w-full py-3.5 rounded-2xl bg-gold text-navy font-black text-sm uppercase tracking-wider shadow-lg hover:bg-gold-light flex items-center justify-center gap-2"
            >
              <span>Pay {formatPrice(total)} Now</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}

      </div>
    </div>
  );
}
