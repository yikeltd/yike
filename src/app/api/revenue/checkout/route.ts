import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createOrder, fulfillOrder } from "@/lib/revenue/service";

export const runtime = "nodejs";

/**
 * POST /api/revenue/checkout — Initialize order & fulfill checkout
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    const userId = session?.id ?? "buyer_guest_01";
    const userName = session?.user_metadata?.full_name ?? "User";
    const body = (await req.json()) as {
      productId: string;
      couponCode?: string;
      simulateSuccess?: boolean;
    };

    if (!body.productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const order = await createOrder(userId, userName, body.productId, body.couponCode);

    // Simulate immediate payment fulfillment in dev/demo mode
    if (body.simulateSuccess !== false) {
      const paymentRef = `payref_${Date.now()}`;
      const fulfilledOrder = await fulfillOrder(order.id, paymentRef);
      return NextResponse.json({ order: fulfilledOrder, checkoutUrl: `/payments/verify?reference=${paymentRef}` });
    }

    return NextResponse.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
