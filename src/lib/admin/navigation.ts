import type { AdminConsole } from "@/lib/admin/roles";
import {
  adminListingsPath,
  adminPath,
  supportPath,
  techPath,
} from "@/lib/admin-paths";

export type NavItem = {
  href: string;
  label: string;
  segment: string;
  /** Search aliases for command palette */
  keywords?: string[];
  /** Visual weight in sidebar */
  emphasis?: "primary" | "default" | "muted";
  /** Key for urgent-count badges (layout supplies counts) */
  badgeKey?: string;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
  /** Keep expanded on first visit (e.g. Overview) */
  defaultExpanded?: boolean;
};

export type SectionTab = {
  href: string;
  label: string;
};

export const TRUST_SECTION_TABS: SectionTab[] = [
  { href: adminPath("trust"), label: "Trust Center" },
  { href: adminPath("trust-review-queue"), label: "Trust Queue" },
  { href: adminPath("verification-control"), label: "Verification" },
  { href: adminPath("security-events"), label: "Security" },
  { href: adminPath("trust-metrics"), label: "Metrics" },
];

export const PROMOTIONS_SECTION_TABS: SectionTab[] = [
  { href: adminPath("advertising"), label: "Advertising" },
  { href: adminPath("featured"), label: "Featured" },
  { href: adminPath("premium-deals"), label: "Premium" },
  { href: adminPath("hot-picks"), label: "Hot Picks" },
  { href: adminPath("ads"), label: "Ads (legacy)" },
  { href: adminPath("banners"), label: "Banners" },
  { href: adminPath("promo-banners"), label: "Promo Banners" },
];

export const REVENUE_SECTION_TABS: SectionTab[] = [
  { href: adminPath("revenue/overview"), label: "Overview" },
  { href: adminPath("revenue/transactions"), label: "Transactions" },
  { href: adminPath("revenue/pricing"), label: "Pricing" },
  { href: adminPath("subscriptions"), label: "Subscriptions" },
  { href: adminPath("revenue/featured-listings"), label: "Featured Listings" },
];

export const PARTNERS_SECTION_TABS: SectionTab[] = [
  { href: adminPath("ambassadors"), label: "Ambassadors" },
  { href: adminPath("ambassadors/payouts"), label: "Amb. Payouts" },
  { href: adminPath("verifiers"), label: "Verifiers" },
  { href: adminPath("verifiers/payouts"), label: "Verifier Payouts" },
  { href: adminPath("legal-partners"), label: "Legal Partners" },
  { href: adminPath("legal-partners/payouts"), label: "Legal Payouts" },
  { href: adminPath("home-services"), label: "Home Services" },
];

export const AUTH_NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    defaultExpanded: true,
    items: [
      {
        href: adminPath("overview"),
        label: "Dashboard",
        segment: "overview",
        emphasis: "primary",
        keywords: ["home", "hq", "dashboard"],
      },
      {
        href: adminPath("overview"),
        label: "Command Center",
        segment: "overview",
        emphasis: "primary",
        keywords: ["command", "operations", "control"],
      },
      {
        href: adminPath("security-events"),
        label: "Live Activity",
        segment: "security-events",
        keywords: ["live", "realtime", "activity", "timeline"],
      },
      {
        href: adminPath("health"),
        label: "System Health",
        segment: "health",
        emphasis: "primary",
        keywords: ["health", "status", "uptime"],
      },
    ],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    items: [
      {
        href: adminListingsPath("pending"),
        label: "Listings",
        segment: "listings",
        emphasis: "primary",
        keywords: ["properties", "cars", "inventory"],
      },
      {
        href: `${adminListingsPath("all")}?asset_type=VEHICLE`,
        label: "Vehicles",
        segment: "listings",
        keywords: ["cars", "autos", "trucks"],
      },
      {
        href: `${adminListingsPath("all")}?asset_type=PROPERTY`,
        label: "Properties",
        segment: "listings",
        keywords: ["houses", "apartments", "land"],
      },
      {
        href: adminPath("seo-pages"),
        label: "Locations",
        segment: "seo-pages",
        keywords: ["cities", "hubs", "states"],
      },
      {
        href: adminPath("reviews"),
        label: "Reviews",
        segment: "reviews",
        keywords: ["rating", "feedback"],
      },
      {
        href: adminPath("featured"),
        label: "Featured",
        segment: "featured",
        keywords: ["promoted", "boosted"],
      },
      {
        href: adminPath("listings/review"),
        label: "Moderation Queue",
        segment: "listings/review",
        emphasis: "primary",
        badgeKey: "pending-reviews",
        keywords: ["pending", "review", "approve"],
      },
    ],
  },
  {
    id: "business",
    label: "Business",
    items: [
      {
        href: adminPath("agents"),
        label: "Dealers",
        segment: "agents",
        emphasis: "primary",
        keywords: ["dealers", "autodealers"],
      },
      {
        href: adminPath("company-verification"),
        label: "Agencies",
        segment: "company-verification",
        keywords: ["agencies", "cac"],
      },
      {
        href: `${adminPath("users")}?filter=developers`,
        label: "Developers",
        segment: "users",
        keywords: ["developers", "builders"],
      },
      {
        href: `${adminPath("users")}?filter=landlords`,
        label: "Landlords",
        segment: "users",
        keywords: ["landlords", "owners"],
      },
      {
        href: adminPath("company-verification"),
        label: "Companies",
        segment: "company-verification",
        keywords: ["companies", "cac"],
      },
      {
        href: adminPath("verification-control"),
        label: "Verification",
        segment: "verification-control",
        keywords: ["badge", "verify"],
      },
    ],
  },
  {
    id: "people",
    label: "People",
    items: [
      {
        href: adminPath("users"),
        label: "Users",
        segment: "users",
        emphasis: "primary",
        keywords: ["accounts", "buyers", "sellers"],
      },
      {
        href: adminPath("staff"),
        label: "Staff",
        segment: "staff",
        keywords: ["team", "admin", "roles"],
      },
      {
        href: adminPath("staff"),
        label: "Roles & Permissions",
        segment: "staff",
        keywords: ["permissions", "access"],
      },
      {
        href: adminPath("careers/applications"),
        label: "Applications",
        segment: "careers",
        keywords: ["hiring", "jobs"],
      },
    ],
  },
  {
    id: "growth",
    label: "Growth",
    items: [
      {
        href: adminPath("advertising"),
        label: "Promotions",
        segment: "advertising",
        emphasis: "primary",
        keywords: ["ads", "campaigns"],
      },
      {
        href: adminPath("promo-banners"),
        label: "Campaigns",
        segment: "promo-banners",
        keywords: ["banners", "campaigns"],
      },
      {
        href: adminPath("seo-pages"),
        label: "SEO",
        segment: "seo-pages",
        keywords: ["seo", "content", "landing"],
      },
      {
        href: adminPath("banners"),
        label: "Landing Pages",
        segment: "banners",
        keywords: ["landing", "banners"],
      },
      {
        href: adminPath("market-intelligence"),
        label: "Search Insights",
        segment: "market-intelligence",
        keywords: ["search", "keywords", "demand"],
      },
    ],
  },
  {
    id: "trust",
    label: "Trust & Safety",
    items: [
      {
        href: adminPath("trust"),
        label: "Trust Center",
        segment: "trust",
        emphasis: "primary",
        keywords: ["trust", "scores"],
      },
      {
        href: adminPath("reports"),
        label: "Reports",
        segment: "reports",
        badgeKey: "open-reports",
        keywords: ["flags", "abuse"],
      },
      {
        href: adminPath("duplicates"),
        label: "Fraud & Duplicates",
        segment: "duplicates",
        badgeKey: "duplicate-flags",
        keywords: ["fraud", "duplicate"],
      },
      {
        href: adminPath("verification-control"),
        label: "Verification Control",
        segment: "verification-control",
        keywords: ["verify", "badge"],
      },
      {
        href: adminPath("trust-review-queue"),
        label: "Blocked Accounts",
        segment: "trust-review-queue",
        badgeKey: "trust-queue",
        keywords: ["banned", "suspensions"],
      },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    items: [
      {
        href: adminPath("revenue/transactions"),
        label: "Payments",
        segment: "revenue/transactions",
        emphasis: "primary",
        keywords: ["paystack", "safehaven"],
      },
      {
        href: adminPath("revenue/transactions"),
        label: "Transactions",
        segment: "revenue/transactions",
        keywords: ["orders", "billing"],
      },
      {
        href: adminPath("subscriptions"),
        label: "Subscriptions",
        segment: "subscriptions",
        keywords: ["pro", "plans"],
      },
      {
        href: adminPath("revenue/pricing"),
        label: "Plans & Pricing",
        segment: "revenue/pricing",
        keywords: ["plans", "rates"],
      },
      {
        href: adminPath("revenue/overview"),
        label: "Revenue Overview",
        segment: "revenue/overview",
        keywords: ["mrr", "revenue"],
      },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    items: [
      {
        href: adminPath("health"),
        label: "Feature Flags",
        segment: "health",
        keywords: ["flags", "launch"],
      },
      {
        href: adminPath("health"),
        label: "Background Jobs",
        segment: "health",
        keywords: ["cron", "jobs"],
      },
      {
        href: adminPath("market-intelligence"),
        label: "Search & Metadata",
        segment: "market-intelligence",
        keywords: ["search", "index"],
      },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    items: [
      {
        href: adminPath("marketplace-analytics"),
        label: "Marketplace Analytics",
        segment: "marketplace-analytics",
        emphasis: "primary",
        keywords: ["marketplace", "analytics"],
      },
      {
        href: adminPath("analytics"),
        label: "Growth Analytics",
        segment: "analytics",
        keywords: ["growth", "ceo"],
      },
      {
        href: adminPath("trust-metrics"),
        label: "Trust Analytics",
        segment: "trust-metrics",
        keywords: ["trust", "scores"],
      },
      {
        href: adminPath("revenue/overview"),
        label: "Revenue Analytics",
        segment: "revenue/overview",
        keywords: ["revenue", "mrr"],
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    items: [
      {
        href: adminPath("settings"),
        label: "General Settings",
        segment: "settings",
        keywords: ["config"],
      },
      {
        href: adminPath("notifications"),
        label: "Notifications",
        segment: "notifications",
        keywords: ["email", "sms", "alerts"],
      },
      {
        href: adminPath("audit-logs"),
        label: "Audit Logs",
        segment: "audit-logs",
        keywords: ["audit", "logs"],
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      {
        href: "/profile",
        label: "My Profile",
        segment: "profile",
        keywords: ["profile", "me"],
      },
      {
        href: adminPath("security-events"),
        label: "Security",
        segment: "security-events",
        keywords: ["security", "logins"],
      },
      {
        href: "/auth/login?switch=1",
        label: "Logout",
        segment: "logout",
        keywords: ["signout", "logout"],
      },
    ],
  },
];

export const SUPPORT_NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    defaultExpanded: true,
    items: [{ href: supportPath(), label: "Dashboard", segment: "", emphasis: "primary" }],
  },
  {
    id: "support",
    label: "Support",
    items: [
      { href: supportPath("reports"), label: "Listing Reports", segment: "reports", emphasis: "primary" },
      { href: supportPath("requests"), label: "Contact Messages", segment: "requests" },
      { href: supportPath("leads"), label: "WhatsApp Leads", segment: "leads", emphasis: "primary" },
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
    defaultExpanded: true,
    items: [
      { href: techPath(), label: "Health Dashboard", segment: "", emphasis: "primary" },
      {
        href: adminPath("health"),
        label: "Launch Health",
        segment: "launch-health",
        keywords: ["fat", "rc", "systems", "sms"],
      },
    ],
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
      { href: techPath("uploads"), label: "Uploads & Protection", segment: "uploads" },
    ],
  },
];

export type AdminNavBadges = Record<string, number>;

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

function segmentAllowed(segment: string, allowlist: string[]): boolean {
  if (allowlist.includes(segment)) return true;
  return allowlist.some(
    (s) => s.length > 0 && (segment === s || segment.startsWith(`${s}/`))
  );
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
    "verification-control",
  ]
): NavGroup[] {
  if (!allowlist) return groups;
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (item) =>
          segmentAllowed(item.segment, allowlist) &&
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

export function flattenNavGroups(groups: NavGroup[]): NavItem[] {
  const seen = new Set<string>();
  const out: NavItem[] = [];
  for (const g of groups) {
    for (const item of g.items) {
      if (seen.has(item.href)) continue;
      seen.add(item.href);
      out.push(item);
    }
  }
  return out;
}

export function findActiveNavGroupId(
  pathname: string,
  groups: NavGroup[]
): string | null {
  for (const g of groups) {
    for (const item of g.items) {
      if (
        pathname === item.href ||
        (pathname.startsWith(item.href + "/") && item.href.length > 10)
      ) {
        return g.id;
      }
    }
  }
  for (const g of groups) {
    for (const item of g.items) {
      if (pathname.startsWith(item.href)) return g.id;
    }
  }
  return groups[0]?.id ?? null;
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
