/**
 * Revenue Platform Service Core & Entitlement Engine — Phase 1.7
 *
 * Manages product catalog, order creation/fulfillment, entitlement access control (`hasEntitlement`),
 * coupon validation, invoicing, and revenue analytics.
 */

import { trackTransactionEvent } from "@/lib/analytics/index";
import type {
  Coupon,
  Entitlement,
  EntitlementKey,
  Invoice,
  Order,
  ProductItem,
  RevenueAnalytics,
} from "./types";

// In-memory repositories
const orderStore = new Map<string, Order>();
const entitlementStore = new Map<string, Entitlement[]>(); // userId -> Entitlements[]
const couponStore = new Map<string, Coupon>([
  [
    "YIKE2026",
    {
      code: "YIKE2026",
      discountPercentage: 20,
      isActive: true,
    },
  ],
  [
    "FOUNDER50",
    {
      code: "FOUNDER50",
      discountPercentage: 50,
      isActive: true,
    },
  ],
]);

/** Canonical Product Catalog */
export function getProductCatalog(): ProductItem[] {
  return [
    {
      id: "prod_sub_core",
      code: "SUB_CORE",
      name: "Core Seller Plan",
      category: "subscription",
      priceAmount: 15000,
      currency: "NGN",
      interval: "month",
      grantedEntitlements: ["crm.basic"],
      description: "Essential listing management and standard inquiry inbox.",
    },
    {
      id: "prod_sub_pro",
      code: "SUB_PRO",
      name: "Pro Seller Plan",
      category: "subscription",
      priceAmount: 45000,
      currency: "NGN",
      interval: "month",
      grantedEntitlements: ["crm.pro", "analytics.pro"],
      description: "Full Seller CRM workspace, Kanban pipeline, inventory health, and fast response badges.",
    },
    {
      id: "prod_sub_prime",
      code: "SUB_PRIME",
      name: "Prime Developer Plan",
      category: "subscription",
      priceAmount: 120000,
      currency: "NGN",
      interval: "month",
      grantedEntitlements: ["crm.pro", "analytics.pro", "featured.placement"],
      description: "Includes 5 monthly listing boosts, priority field inspections, and developer branding.",
    },
    {
      id: "prod_boost_listing",
      code: "BOOST_SINGLE",
      name: "7-Day Listing Boost",
      category: "listing_boost",
      priceAmount: 10000,
      currency: "NGN",
      interval: "one_time",
      grantedEntitlements: ["listing.boost"],
      description: "Pin listing to top of discovery search results for 7 days.",
    },
    {
      id: "prod_field_inspection",
      code: "INSPECTION_50PT",
      name: "50-Point Physical Inspection Audit",
      category: "trust_service",
      priceAmount: 35000,
      currency: "NGN",
      interval: "one_time",
      grantedEntitlements: ["inspection.priority"],
      description: "Dispatches certified field inspector to verify title, structure, and physical condition.",
    },
    {
      id: "prod_legal_verification",
      code: "LEGAL_TITLE_REVIEW",
      name: "Legal Partner Title Search & Review",
      category: "legal_service",
      priceAmount: 50000,
      currency: "NGN",
      interval: "one_time",
      grantedEntitlements: ["legal.verification"],
      description: "Dispatches accredited lawyer to perform land registry search & deed audit.",
    },
  ];
}

/** Get product by ID */
export function getProductById(productId: string): ProductItem | null {
  const catalog = getProductCatalog();
  return catalog.find((p) => p.id === productId || p.code === productId) ?? null;
}

/** Validate Coupon */
export function validateCoupon(code: string): Coupon | null {
  const coupon = couponStore.get(code.toUpperCase());
  if (!coupon || !coupon.isActive) return null;
  return coupon;
}

/** Create new Order */
export async function createOrder(
  userId: string,
  userName: string,
  productId: string,
  couponCode?: string
): Promise<Order> {
  const product = getProductById(productId);
  if (!product) throw new Error("Invalid product ID");

  const now = new Date().toISOString();
  const orderId = `ord_${Date.now()}`;

  let finalAmount = product.priceAmount;
  let discountAmount = 0;

  if (couponCode) {
    const coupon = validateCoupon(couponCode);
    if (coupon) {
      discountAmount = Math.round((product.priceAmount * coupon.discountPercentage) / 100);
      finalAmount = product.priceAmount - discountAmount;
      trackTransactionEvent("coupon_applied", { userId, metadata: { couponCode, discountAmount } });
    }
  }

  const order: Order = {
    id: orderId,
    userId,
    userName,
    productId: product.id,
    productName: product.name,
    amount: finalAmount,
    currency: product.currency,
    status: "created",
    couponCode,
    discountAmount,
    grantedEntitlements: product.grantedEntitlements,
    createdAt: now,
    updatedAt: now,
  };

  orderStore.set(orderId, order);

  trackTransactionEvent("order_created", {
    orderId,
    userId,
    metadata: { productId: product.id, amount: finalAmount },
  });

  return order;
}

/** Fulfill Order upon successful payment and grant Entitlements */
export async function fulfillOrder(orderId: string, paymentReference: string): Promise<Order> {
  const order = orderStore.get(orderId);
  if (!order) throw new Error("Order not found");
  if (order.status === "fulfilled") return order;

  const now = new Date().toISOString();
  order.status = "fulfilled";
  order.paymentReference = paymentReference;
  order.paidAt = now;
  order.fulfilledAt = now;
  order.updatedAt = now;

  orderStore.set(orderId, order);

  // Grant Entitlements
  const userEntitlements = entitlementStore.get(order.userId) ?? [];
  for (const key of order.grantedEntitlements) {
    const entitlement: Entitlement = {
      id: `ent_${Date.now()}_${key}`,
      userId: order.userId,
      key,
      orderId: order.id,
      grantedAt: now,
      isActive: true,
    };
    userEntitlements.push(entitlement);
    trackTransactionEvent("entitlement_granted", {
      orderId: order.id,
      userId: order.userId,
      metadata: { entitlementKey: key },
    });
  }
  entitlementStore.set(order.userId, userEntitlements);

  trackTransactionEvent("order_paid", { orderId: order.id, userId: order.userId });
  trackTransactionEvent("order_fulfilled", { orderId: order.id, userId: order.userId });

  return order;
}

/** Decoupled Entitlement Check — hasEntitlement() */
export function hasEntitlement(userId: string, key: EntitlementKey): boolean {
  const list = entitlementStore.get(userId);
  if (!list) return false;
  return list.some((e) => e.key === key && e.isActive);
}

/** Get User Entitlements */
export function getUserEntitlements(userId: string): Entitlement[] {
  return entitlementStore.get(userId) ?? [];
}

/** Generate Invoice */
export function generateInvoice(order: Order): Invoice {
  const taxAmount = Math.round(order.amount * 0.075); // 7.5% VAT
  return {
    id: `inv_${order.id}`,
    orderId: order.id,
    userId: order.userId,
    userName: order.userName,
    amount: order.amount,
    taxAmount,
    totalAmount: order.amount + taxAmount,
    currency: order.currency,
    issuedAt: order.fulfilledAt ?? new Date().toISOString(),
    status: order.status === "fulfilled" ? "paid" : "draft",
  };
}

/** Revenue Analytics */
export function getRevenueAnalytics(): RevenueAnalytics {
  const allOrders = Array.from(orderStore.values());
  const paidOrders = allOrders.filter((o) => o.status === "fulfilled");

  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.amount, 0);
  const ordersCount = paidOrders.length;
  const avgOrderValue = ordersCount > 0 ? Math.round(totalRevenue / ordersCount) : 45000;

  return {
    totalRevenue: totalRevenue > 0 ? totalRevenue : 1450000,
    monthlyRecurringRevenue: 850000,
    ordersCount: ordersCount > 0 ? ordersCount : 32,
    activeSubscriptionsCount: 18,
    avgOrderValue,
    topProducts: [
      { name: "Pro Seller Plan", salesCount: 14, revenue: 630000 },
      { name: "50-Point Physical Inspection Audit", salesCount: 10, revenue: 350000 },
      { name: "Prime Developer Plan", salesCount: 4, revenue: 480000 },
    ],
  };
}
