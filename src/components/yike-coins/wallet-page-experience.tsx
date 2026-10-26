"use client";

import Link from "next/link";
import { ArrowLeft, Coins, History, PlusCircle, Send } from "lucide-react";
import { WalletBalanceHero } from "@/components/yike-coins/wallet-balance-hero";
import { WalletUsernameSection } from "@/app/(public)/account/coins/wallet-username-section";
import { YikeCoinsTopupClient } from "@/app/(public)/account/coins/topup-client";
import { SendYcClient } from "@/app/(public)/account/coins/send-yc-client";
import { YikeCoinsLedgerClient } from "@/app/(public)/account/coins/ledger-client";
import { YikeCoinsNonCashNotice } from "@/components/yike-coins/non-cash-notice";
import { WalletVideoAllowance } from "@/components/yike-coins/wallet-video-allowance";
import type { VideoCallPreflight } from "@/lib/video-calls/allowance";
import { cn } from "@/lib/utils";

type BackNav = { href: string; label: string };

type Props = {
  backNav: BackNav;
  initialBalance: number;
  video: VideoCallPreflight;
  initialUsername: string | null;
  initialNeedsUsername: boolean;
  hasUsername: boolean;
};

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function WalletPageExperience({
  backNav,
  initialBalance,
  video,
  initialUsername,
  initialNeedsUsername,
  hasUsername,
}: Props) {
  return (
    <div
      className="mx-auto w-full max-w-lg px-3 py-5 sm:px-4 lg:max-w-2xl lg:py-8"
      data-testid="yike-coins-wallet-page"
    >
      <header className="mb-5 space-y-4">
        <Link
          href={backNav.href}
          className="pressable inline-flex min-h-[44px] max-w-full items-center gap-2 text-sm font-bold text-navy/75 hover:text-navy"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{backNav.label}</span>
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-gold shadow-sm">
                <Coins className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h1 className="text-xl font-black tracking-tight text-navy sm:text-2xl">
                  Yike Coins
                </h1>
                <p className="text-xs text-navy/60 sm:text-sm">
                  Platform credits for eligible Yike services · 1 YC ≈ ₦1 nominal
                </p>
              </div>
            </div>
          </div>
        </div>
        <WalletUsernameSection
          initialUsername={initialUsername}
          initialNeedsUsername={initialNeedsUsername}
        />
      </header>

      <WalletBalanceHero initialBalance={initialBalance} />

      <nav
        className="mt-4 grid grid-cols-3 gap-2 sm:gap-3"
        aria-label="Wallet primary actions"
      >
        <WalletActionButton
          icon={PlusCircle}
          label="Top up"
          primary
          onClick={() => scrollToSection("wallet-top-up")}
        />
        <WalletActionButton
          icon={Send}
          label="Send YC"
          onClick={() => scrollToSection("wallet-send")}
        />
        <WalletActionButton
          icon={History}
          label="History"
          onClick={() => scrollToSection("wallet-history")}
        />
      </nav>

      <WalletVideoAllowance video={video} className="mt-4" />

      <WalletSection id="wallet-top-up" title="Top up" subtitle="Pay with Paystack · credits after verification">
        <YikeCoinsTopupClient />
      </WalletSection>

      <WalletSection id="wallet-send" title="Send YC" subtitle="Transfer to another Yike member by username">
        <SendYcClient balanceCoins={initialBalance} hasUsername={hasUsername} />
      </WalletSection>

      <WalletSection
        id="wallet-history"
        title="Transaction history"
        subtitle="Wallet ledger · credits and debits on your account"
        action={
          <Link
            href="/payments/history"
            className="pressable text-xs font-bold text-navy/65 underline-offset-2 hover:text-navy hover:underline"
          >
            Paystack receipts
          </Link>
        }
      >
        <YikeCoinsLedgerClient />
      </WalletSection>

      <YikeCoinsNonCashNotice className="mt-8" />
      <p className="mt-3 text-center text-[11px] text-navy/50">
        Sending YC requires a username. Paystack fees may apply at checkout.
      </p>
    </div>
  );
}

function WalletActionButton({
  icon: Icon,
  label,
  onClick,
  primary = false,
}: {
  icon: typeof PlusCircle;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "pressable flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-center transition sm:min-h-[52px]",
        primary
          ? "border-gold/40 bg-gold text-navy shadow-sm hover:bg-gold-dark/90"
          : "border-navy/10 bg-white text-navy hover:border-gold/30 hover:bg-surface/80",
      )}
    >
      <Icon className={cn("h-5 w-5", primary ? "text-navy" : "text-navy/70")} aria-hidden />
      <span className="text-[11px] font-bold leading-tight sm:text-xs">{label}</span>
    </button>
  );
}

function WalletSection({
  id,
  title,
  subtitle,
  action,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-8 scroll-mt-24" aria-labelledby={`${id}-heading`}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id={`${id}-heading`} className="text-base font-black text-navy">
            {title}
          </h2>
          {subtitle ? <p className="mt-0.5 text-xs text-navy/55">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
