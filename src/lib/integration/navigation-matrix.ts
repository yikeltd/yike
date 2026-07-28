/**
 * Cross-Platform Navigation Matrix & Integration Helper — Phase 1.6
 *
 * Validates cross-platform navigation paths and bidirectional linking across
 * Discovery, Conversation, Identity, Trust Operations, Commerce, and Seller CRM.
 */

export type NavigationTarget =
  | "discovery_listings"
  | "conversation_workspace"
  | "trust_passport"
  | "trust_audit"
  | "seller_crm"
  | "operations_cases"
  | "admin_command_center";

export type NavigationLink = {
  target: NavigationTarget;
  href: string;
  label: string;
  isExternal?: boolean;
};

/** Get canonical link for any platform target */
export function getCanonicalNavigationLink(
  target: NavigationTarget,
  params?: { userId?: string; conversationId?: string; listingSlug?: string; caseId?: string }
): NavigationLink {
  switch (target) {
    case "discovery_listings":
      return {
        target: "discovery_listings",
        href: params?.listingSlug ? `/properties/${params.listingSlug}` : "/properties",
        label: "Browse Listings",
      };
    case "conversation_workspace":
      return {
        target: "conversation_workspace",
        href: params?.conversationId ? `/conversations/${encodeURIComponent(params.conversationId)}` : "/conversations",
        label: "Conversation Workspace",
      };
    case "trust_passport":
      return {
        target: "trust_passport",
        href: `/trust/${encodeURIComponent(params?.userId ?? "seller_01")}`,
        label: "Yike Passport",
      };
    case "trust_audit":
      return {
        target: "trust_audit",
        href: `/api/trust/audit/${encodeURIComponent(params?.userId ?? "seller_01")}`,
        label: "Trust Score Audit API",
        isExternal: true,
      };
    case "seller_crm":
      return {
        target: "seller_crm",
        href: "/seller/crm",
        label: "Seller CRM Workspace",
      };
    case "operations_cases":
      return {
        target: "operations_cases",
        href: params?.caseId ? `/lex/auth/cases?id=${encodeURIComponent(params.caseId)}` : "/lex/auth/cases",
        label: "Trust Operations Cases",
      };
    case "admin_command_center":
      return {
        target: "admin_command_center",
        href: "/lex/auth",
        label: "Staff Command Center",
      };
  }
}
