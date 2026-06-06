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
      { href: adminPath("audit-logs"), label: "Audit Logs", segment: "audit-logs" },
    ],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    items: [
      { href: adminPath("listings"), label: "Listings", segment: "listings" },
      { href: adminPath("agents"), label: "Agents", segment: "agents" },
      { href: adminPath("reviews"), label: "Reviews", segment: "reviews" },
      { href: adminPath("reports"), label: "Reports", segment: "reports" },
      { href: adminPath("leads"), label: "Leads", segment: "leads" },
      { href: adminPath("requests"), label: "Requests", segment: "requests" },
    ],
  },
  {
    id: "promotion",
    label: "Promotion",
    items: [
      { href: adminPath("featured"), label: "Featured", segment: "featured" },
      { href: adminPath("hot-picks"), label: "Hot Picks", segment: "hot-picks" },
      { href: adminPath("ads"), label: "Ads", segment: "ads" },
      { href: adminPath("banners"), label: "Banners", segment: "banners" },
    ],
  },
  {
    id: "people",
    label: "People",
    items: [
      { href: adminPath("users"), label: "Users", segment: "users" },
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
    id: "system",
    label: "System",
    items: [
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
  superAdminOnlySegments: string[] = ["staff", "audit-logs", "settings", "users"]
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
