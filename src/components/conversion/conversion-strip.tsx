"use client";

import Link from "next/link";
import { Search, MessageCircle, PenLine, Shield, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { ListPropertyCta } from "@/components/auth/list-property-cta";

const links = [
  { href: "/", label: "Browse listings", icon: Search },
  { href: "/verify-agent", label: "Verify to list", icon: Shield },
  { href: "/request-property", label: "Request a home", icon: MessageCircle },
  { href: "/safety", label: "Report scams", icon: Flag },
];

export function ConversionStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 rounded-2xl bg-surface/80 p-3 ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
        className
      )}
    >
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="pressable inline-flex items-center gap-1.5 rounded-xl bg-elevated px-3 py-2 text-xs font-bold text-navy shadow-sm hover:bg-gold/10 dark:text-foreground"
        >
          <Icon className="h-3.5 w-3.5 text-gold-dark" />
          {label}
        </Link>
      ))}
      <ListPropertyCta className="pressable inline-flex items-center gap-1.5 rounded-xl bg-elevated px-3 py-2 text-xs font-bold text-navy shadow-sm hover:bg-gold/10 dark:text-foreground">
        <PenLine className="h-3.5 w-3.5 text-gold-dark" />
        List free
      </ListPropertyCta>
    </div>
  );
}
