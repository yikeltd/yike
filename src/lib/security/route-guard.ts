/**
 * Security & Route Guard Audit Helper — Phase 1.6
 *
 * Verifies role boundaries and route permissions across seller, buyer, staff, and verifier spaces.
 */

export type UserRole = "buyer" | "seller" | "agent" | "verifier" | "legal_partner" | "staff_admin";

export type RoutePermissionResult = {
  authorized: boolean;
  redirectUrl?: string;
  reason?: string;
};

/** Verify if user role is authorized for route path */
export function checkRoutePermission(pathname: string, userRole?: UserRole): RoutePermissionResult {
  // Staff Command Center (/lex/auth/*)
  if (pathname.startsWith("/lex/auth")) {
    if (userRole !== "staff_admin") {
      return {
        authorized: false,
        redirectUrl: "/lex/auth/login",
        reason: "Staff credentials required for admin command center",
      };
    }
  }

  // Seller CRM (/seller/crm)
  if (pathname.startsWith("/seller/crm")) {
    if (!userRole) {
      return {
        authorized: false,
        redirectUrl: "/auth/login?next=/seller/crm",
        reason: "Authentication required for Seller CRM workspace",
      };
    }
  }

  // Verifier Portal (/verifier)
  if (pathname.startsWith("/verifier")) {
    if (userRole !== "verifier" && userRole !== "staff_admin") {
      return {
        authorized: false,
        redirectUrl: "/become-a-field-verifier",
        reason: "Approved field verifier status required",
      };
    }
  }

  return { authorized: true };
}
