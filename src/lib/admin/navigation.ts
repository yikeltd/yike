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
  { href: adminPath("featured"), label: "Featured" },
  { href: adminPath("premium-deals"), label: "Premium" },
  { href: adminPath("hot-picks"), label: "Hot Picks" },
  { href: adminPath("ads"), label: "Ads" },
  { href: adminPath("banners"), label: "Banners" },
  { href: adminPath("promo-banners"), label: "Promo Banners" },
];

export const REVENUE_SECTION_TABS: SectionTab[] = [
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
        keywords: ["home", "hq", "command", "dashboard"],
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
        keywords: ["properties", "moderation", "approve"],
      },
      {
        href: adminPath("listings/review"),
        label: "Bulk Review",
        segment: "listings/review",
        emphasis: "primary",
        badgeKey: "pending-reviews",
        keywords: ["pending", "bulk", "approve", "reject"],
      },
      {
        href: adminPath("leads"),
        label: "Leads",
        segment: "leads",
        emphasis: "primary",
        keywords: ["whatsapp", "inquiry"],
      },
      {
        href: adminPath("reviews"),
        label: "Reviews",
        segment: "reviews",
        keywords: ["rating", "feedback"],
      },
      {
        href: adminPath("duplicates"),
        label: "Duplicate Flags",
        segment: "duplicates",
        badgeKey: "duplicate-flags",
        keywords: ["fraud", "duplicate"],
      },
      {
        href: adminPath("expiring-listings"),
        label: "Expiring Listings",
        segment: "expiring-listings",
        badgeKey: "expiring-listings",
        keywords: ["expire", "renew"],
      },
      {
        href: adminPath("listing-health"),
        label: "Listing Health",
        segment: "listing-health",
        keywords: ["quality", "moderation"],
      },
      {
        href: adminPath("pricing-warnings"),
        label: "Pricing Warnings",
        segment: "pricing-warnings",
        badgeKey: "pricing-warnings",
        keywords: ["price", "anomaly"],
      },
      {
        href: adminPath("reports"),
        label: "Reports",
        segment: "reports",
        badgeKey: "open-reports",
        keywords: ["abuse", "flag", "scam"],
      },
      {
        href: adminPath("requests"),
        label: "Requests",
        segment: "requests",
        keywords: ["property request", "contact"],
      },
    ],
  },
  {
    id: "revenue",
    label: "Revenue",
    items: [
      {
        href: adminPath("revenue/featured-listings"),
        label: "Featured Listings",
        segment: "revenue/featured-listings",
        emphasis: "primary",
        keywords: ["promotion", "featured", "monetization", "orders"],
      },
    ],
  },
  {
    id: "promotions",
    label: "Promotions",
    items: [
      {
        href: adminPath("featured"),
        label: "Featured Listings",
        segment: "featured",
        emphasis: "primary",
        keywords: ["boost", "highlight"],
      },
      {
        href: adminPath("premium-deals"),
        label: "Premium Placements",
        segment: "premium-deals",
        keywords: ["premium", "placement"],
      },
      {
        href: adminPath("hot-picks"),
        label: "Hot Picks",
        segment: "hot-picks",
        keywords: ["trending", "hot"],
      },
      {
        href: adminPath("email-ads"),
        label: "Email ads",
        segment: "email-ads",
        keywords: ["email", "transactional", "sponsor"],
      },
      { href: adminPath("ads"), label: "Ads", segment: "ads", keywords: ["advertising"] },
      { href: adminPath("banners"), label: "Banners", segment: "banners" },
      {
        href: adminPath("promo-banners"),
        label: "Promo Banners",
        segment: "promo-banners",
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
        keywords: ["trust", "fraud", "verification"],
      },
      {
        href: adminPath("trust-review-queue"),
        label: "Trust Queue",
        segment: "trust-review-queue",
        emphasis: "primary",
        badgeKey: "trust-queue",
        keywords: ["escalation", "review"],
      },
      {
        href: adminPath("verification-control"),
        label: "Verification Control",
        segment: "verification-control",
        keywords: ["agent verify", "badge"],
      },
      {
        href: adminPath("security-events"),
        label: "Security Events",
        segment: "security-events",
        emphasis: "muted",
        keywords: ["security", "login"],
      },
      {
        href: adminPath("trust-metrics"),
        label: "Trust Metrics",
        segment: "trust-metrics",
        emphasis: "muted",
        keywords: ["analytics", "score"],
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
        keywords: ["accounts", "renters", "browse"],
      },
      {
        href: `${adminPath("users")}?filter=individuals`,
        label: "Individuals",
        segment: "users",
        keywords: ["sellers", "private listers"],
      },
      {
        href: adminPath("agents"),
        label: "Agent verification",
        segment: "agents",
        emphasis: "primary",
        keywords: ["listers", "verify", "nin"],
      },
      {
        href: `${adminPath("users")}?filter=agents`,
        label: "Agents",
        segment: "users",
        keywords: ["account type agent", "listers"],
      },
      {
        href: `${adminPath("users")}?filter=landlords`,
        label: "Landlords",
        segment: "users",
        keywords: ["owners", "rental"],
      },
      {
        href: `${adminPath("users")}?filter=developers`,
        label: "Developers",
        segment: "users",
        keywords: ["estate", "projects"],
      },
      {
        href: adminPath("company-verification"),
        label: "Companies",
        segment: "company-verification",
        keywords: ["agency", "company", "cac"],
      },
      {
        href: `${adminPath("users")}?filter=companies`,
        label: "Company accounts",
        segment: "users",
        emphasis: "muted",
        keywords: ["agency accounts"],
      },
      {
        href: adminPath("staff"),
        label: "Staff",
        segment: "staff",
        keywords: ["team", "roles"],
      },
      {
        href: adminPath("careers"),
        label: "Careers",
        segment: "careers",
        keywords: ["jobs", "hiring"],
      },
      {
        href: adminPath("careers/applications"),
        label: "Applications",
        segment: "careers",
        emphasis: "muted",
        keywords: ["applicants", "jobs"],
      },
      {
        href: adminPath("auth-sync"),
        label: "Auth Sync",
        segment: "auth-sync",
        emphasis: "muted",
        keywords: ["advanced", "sync"],
      },
    ],
  },
  {
    id: "partners",
    label: "Partners",
    items: [
      {
        href: adminPath("ambassadors"),
        label: "Ambassadors",
        segment: "ambassadors",
        emphasis: "primary",
        keywords: ["referral", "payout"],
      },
      {
        href: adminPath("ambassadors/payouts"),
        label: "Ambassador Payouts",
        segment: "ambassadors",
        emphasis: "muted",
        keywords: ["payout", "pay"],
      },
      {
        href: adminPath("verifiers"),
        label: "Field Verifiers",
        segment: "verifiers",
        keywords: ["field", "inspection"],
      },
      {
        href: adminPath("verifiers/payouts"),
        label: "Verifier Payouts",
        segment: "verifiers",
        emphasis: "muted",
      },
      {
        href: adminPath("legal-partners"),
        label: "Legal Partners",
        segment: "legal-partners",
      },
      {
        href: adminPath("legal-partners/payouts"),
        label: "Legal Payouts",
        segment: "legal-partners",
        emphasis: "muted",
      },
      {
        href: adminPath("home-services"),
        label: "Home Services",
        segment: "home-services",
        emphasis: "muted",
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      {
        href: adminPath("operations"),
        label: "Ops Hub",
        segment: "operations",
        emphasis: "primary",
        keywords: ["operations", "moderation hub"],
      },
      {
        href: adminPath("deal-matching"),
        label: "Deal Matching",
        segment: "deal-matching",
        keywords: ["deals", "matching"],
      },
      {
        href: adminPath("notifications"),
        label: "Notifications",
        segment: "notifications",
        emphasis: "primary",
        keywords: ["email", "push", "alert"],
      },
      {
        href: adminPath("property-verifications"),
        label: "Property Verification",
        segment: "property-verifications",
        keywords: ["inspection", "verify property"],
      },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    items: [
      {
        href: adminPath("market-intelligence"),
        label: "Market Intelligence",
        segment: "market-intelligence",
        keywords: ["market", "pricing", "data"],
      },
      {
        href: adminPath("seo-pages"),
        label: "SEO Pages",
        segment: "seo-pages",
        emphasis: "muted",
        keywords: ["seo", "content"],
      },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      {
        href: adminPath("settings"),
        label: "Settings",
        segment: "settings",
        keywords: ["config"],
      },
      {
        href: adminPath("health"),
        label: "Health",
        segment: "health",
        emphasis: "muted",
        keywords: ["status", "uptime"],
      },
      {
        href: adminPath("audit-logs"),
        label: "Audit Logs",
        segment: "audit-logs",
        emphasis: "muted",
        keywords: ["advanced", "audit"],
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
    items: [{ href: techPath(), label: "Health Dashboard", segment: "", emphasis: "primary" }],
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
