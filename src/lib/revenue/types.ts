/**
 * Revenue Platform & Entitlement Engine — Types & Models (Phase 1.7)
 *
 * Manages product catalog, order lifecycle, entitlement grants, billing, and promotions.
 */

export type EntitlementKey =
  | "crm.basic"
  | "crm.pro"
  | "listing.boost"
  | "featured.placement"
  | "inspection.priority"
  | "legal.verification"
  | "buyer.assistance.concierge"
  | "analytics.pro";

export type ProductCategory =
  | "subscription"
  | "listing_boost"
  | "trust_service"
  | "legal_service"
  | "buyer_service";

export type ProductItem = {
  id: string;
  code: string;
  name: string;
  category: ProductCategory;
  priceAmount: number;
  currency: string;
  interval?: "month" | "year" | "one_time";
  grantedEntitlements: EntitlementKey[];
  description: string;
};

export type OrderStatus =
  | "created"
  | "pending_payment"
  | "paid"
  | "fulfilled"
  | "expired"
  | "refunded"
  | "cancelled";

export type Order = {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  productName: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  paymentReference?: string;
  couponCode?: string;
  discountAmount?: number;
  grantedEntitlements: EntitlementKey[];
  createdAt: string;
  updatedAt: string;
  paidAt?: string | null;
  fulfilledAt?: string | null;
};

export type Entitlement = {
  id: string;
  userId: string;
  key: EntitlementKey;
  orderId: string;
  grantedAt: string;
  expiresAt?: string | null; // null = lifetime
  isActive: boolean;
};

export type Invoice = {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  billingAddress?: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  issuedAt: string;
  status: "draft" | "paid" | "void";
};

export type Coupon = {
  code: string;
  discountPercentage: number;
  maxDiscountAmount?: number;
  expiresAt?: string;
  isActive: boolean;
};

export type RevenueAnalytics = {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  ordersCount: number;
  activeSubscriptionsCount: number;
  avgOrderValue: number;
  topProducts: Array<{ name: string; salesCount: number; revenue: number }>;
};
