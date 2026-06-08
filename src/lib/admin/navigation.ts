import type { AdminConsole } from "@/lib/admin/roles";
import {
  adminPath,
  supportPath,
  techPath,
} from "@/lib/admin-paths";

export type NavItem = {
  href: string;
  label: string;
  segment: string;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

export const AUTH_NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { href: adminPath("overview"), label: "Dashboard", segment: "overview" },
      { href: adminPath("operations"), label: "Operations", segment: "operations" },
      { href: adminPath("deal-matching"), label: "Deal Matching", segment: "deal-matching" },
      { href: adminPath("trust"), label: "Trust Command Center", segment: "trust" },
    ],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    items: [
      { href: adminPath("listings"), label: "Listings", segment: "listings" },
      { href: adminPath("leads"), label: "Leads", segment: "leads" },
      { href: adminPath("duplicates"), label: "Duplicate Flags", segment: "duplicates" },
      { href: adminPath("expiring-listings"), label: "Expiring Listings", segment: "expiring-listings" },
      { href: adminPath("listing-health"), label: "Listing Health", segment: "listing-health" },
      { href: adminPath("market-intelligence"), label: "Market Intelligence", segment: "market-intelligence" },
      { href: adminPath("pricing-warnings"), label: "Pricing Warnings", segment: "pricing-warnings" },
      { href: adminPath("reviews"), label: "Reviews", segment: "reviews" },
      { href: adminPath("reports"), label: "Reports", segment: "reports" },
      { href: adminPath("requests"), label: "Requests", segment: "requests" },
    ],
  },
  {
    id: "promotion",
    label: "Promotion",
    items: [
      { href: adminPath("featured"), label: "Featured Listings", segment: "featured" },
      { href: adminPath("premium-deals"), label: "Premium Placements", segment: "premium-deals" },
      { href: adminPath("hot-picks"), label: "Hot Picks", segment: "hot-picks" },
      { href: adminPath("ads"), label: "Ads", segment: "ads" },
      { href: adminPath("banners"), label: "Banners", segment: "banners" },
      { href: adminPath("promo-banners"), label: "Promo Banners", segment: "promo-banners" },
      {
        href: adminPath("property-verifications"),
        label: "Property Verifications",
        segment: "property-verifications",
      },
    ],
  },
  {
    id: "people",
    label: "People",
    items: [
      { href: adminPath("agents"), label: "Agents", segment: "agents" },
      {
        href: adminPath("company-verification"),
        label: "Company Verification",
        segment: "company-verification",
      },
      { href: adminPath("trust-metrics"), label: "Trust Metrics", segment: "trust-metrics" },
      { href: adminPath("users"), label: "Users", segment: "users" },
      { href: adminPath("auth-sync"), label: "Auth Sync", segment: "auth-sync" },
      { href: adminPath("security-events"), label: "Security Events", segment: "security-events" },
      { href: adminPath("staff"), label: "Staff", segment: "staff" },
      { href: adminPath("careers"), label: "Careers", segment: "careers" },
      {
        href: adminPath("careers/applications"),
        label: "Applications",
        segment: "careers",
      },
    ],
  },
  {
    id: "partners",
    label: "Partners",
    items: [
      { href: adminPath("ambassadors"), label: "Ambassadors", segment: "ambassadors" },
      {
        href: adminPath("ambassadors/payouts"),
        label: "Ambassador Payouts",
        segment: "ambassadors",
      },
      { href: adminPath("verifiers"), label: "Field Verifiers", segment: "verifiers" },
      {
        href: adminPath("verifiers/payouts"),
        label: "Verifier Payouts",
        segment: "verifiers",
      },
      { href: adminPath("legal-partners"), label: "Legal Partners", segment: "legal-partners" },
      {
        href: adminPath("legal-partners/payouts"),
        label: "Legal Partner Payouts",
        segment: "legal-partners",
      },
      {
        href: adminPath("home-services"),
        label: "Home Services (Prep)",
        segment: "home-services",
      },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { href: adminPath("seo-pages"), label: "SEO Pages", segment: "seo-pages" },
      { href: adminPath("notifications"), label: "Notifications", segment: "notifications" },
      { href: adminPath("audit-logs"), label: "Audit Logs", segment: "audit-logs" },
      { href: adminPath("settings"), label: "Settings", segment: "settings" },
      { href: adminPath("health"), label: "Health", segment: "health" },
    ],
  },
];

export const SUPPORT_NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [{ href: supportPath(), label: "Dashboard", segment: "" }],
  },
  {
    id: "support",
    label: "Support",
    items: [
      { href: supportPath("reports"), label: "Listing Reports", segment: "reports" },
      { href: supportPath("requests"), label: "Contact Messages", segment: "requests" },
      { href: supportPath("leads"), label: "WhatsApp Leads", segment: "leads" },
      { href: supportPath("inspections"), label: "Inspection Requests", segment: "inspections" },
      { href: supportPath("moderation"), label: "Moderation Queue", segment: "moderation" },
      { href: supportPath("quick-replies"), label: "Quick Replies", segment: "quick-replies" },
      { href: supportPath("accounts"), label: "Account Support", segment: "accounts" },
    ],
  },
];

export const TECH_NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [{ href: techPath(), label: "Health Dashboard", segment: "" }],
  },
  {
    id: "monitoring",
    label: "Monitoring",
    items: [
      { href: techPath("webhooks"), label: "Webhooks", segment: "webhooks" },
      { href: techPath("otp"), label: "OTP Failures", segment: "otp" },
      { href: techPath("email"), label: "Email Status", segment: "email" },
      { href: techPath("env"), label: "Env Health", segment: "env" },
      { href: techPath("errors"), label: "Error Logs", segment: "errors" },
      { href: techPath("uploads"), label: "Failed Uploads", segment: "uploads" },
    ],
  },
];

export function getNavGroups(console: AdminConsole): NavGroup[] {
  switch (console) {
    case "auth":
      return AUTH_NAV_GROUPS;
    case "support":
      return SUPPORT_NAV_GROUPS;
    case "tech":
      return TECH_NAV_GROUPS;
  }
}

export function filterNavForRole(
  groups: NavGroup[],
  allowlist: string[] | null,
  superAdminOnlySegments: string[] = [
    "staff",
    "audit-logs",
    "settings",
    "users",
    "auth-sync",
    "deal-matching",
  ]
): NavGroup[] {
  if (!allowlist) return groups;
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (item) =>
          allowlist.includes(item.segment) &&
          !superAdminOnlySegments.includes(item.segment)
      ),
    }))
    .filter((g) => g.items.length > 0);
}

/** Support workers get a limited nav until ops expands permissions. */
const SUPPORT_BASIC_SEGMENTS = new Set([
  "",
  "reports",
  "requests",
  "leads",
  "inspections",
  "quick-replies",
]);

export function filterSupportNavForRole(groups: NavGroup[], role: string): NavGroup[] {
  if (role !== "support") return groups;
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => SUPPORT_BASIC_SEGMENTS.has(item.segment)),
    }))
    .filter((g) => g.items.length > 0);
}

export function consoleTitle(console: AdminConsole): string {
  switch (console) {
    case "auth":
      return "Command Center";
    case "support":
      return "Support Console";
    case "tech":
      return "Tech Console";
  }
}
