"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminPath, SUPPORT_BASE_PATH } from "@/lib/admin-paths";
import { isSuperAdmin } from "@/lib/admin/roles";
import type { UserRole } from "@/types/database";

type LandingPayload = {
  landing?: { path: string; label: string; room: string };
  permissions?: {
    work_areas: string[];
    can_review_listings: boolean;
    can_manage_support: boolean;
    can_enforce_trust: boolean;
  };
};

type Props = {
  role: UserRole;
  displayName: string;
};

export function StaffWorkspaceHome({ role, displayName }: Props) {
  const [data, setData] = useState<LandingPayload | null>(null);

  useEffect(() => {
    void fetch("/api/staff/landing")
      .then((r) => (r.ok ? r.json() : null))
      .then((json: LandingPayload | null) => setData(json));
  }, []);

  const firstName = displayName.split(" ")[0] ?? "there";
  const areas = data?.permissions?.work_areas ?? [];

  const quickLinks = [
    data?.permissions?.can_review_listings
      ? { href: adminPath("listings/review"), label: "Pending listings" }
      : null,
    data?.permissions?.can_enforce_trust
      ? { href: adminPath("trust-review-queue"), label: "Trust queue" }
      : null,
    data?.permissions?.can_manage_support
      ? { href: SUPPORT_BASE_PATH, label: "Support inbox" }
      : null,
    isSuperAdmin(role)
      ? { href: adminPath("audit-logs"), label: "Recent audit" }
      : null,
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <section className="mb-6 rounded-2xl border border-navy/10 bg-white p-4 shadow-sm lg:hidden">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Your workspace
      </p>
      <h2 className="mt-1 text-lg font-bold text-navy">Hi {firstName}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {data?.landing?.label ?? "Operations"} · tap a shortcut to jump in
      </p>

      {areas.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {areas.slice(0, 4).map((area) => (
            <span
              key={area}
              className="rounded-full bg-gold/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-navy"
            >
              {area.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}

      {quickLinks.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="pressable flex min-h-12 items-center justify-center rounded-xl border border-navy/10 bg-surface px-3 text-center text-sm font-semibold text-navy"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
