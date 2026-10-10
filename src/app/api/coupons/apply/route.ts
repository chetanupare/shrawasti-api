import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { quoteCoupon } from "@/lib/coupons";

export async function POST(request: Request) {
  try {
    const { error: authError, status: authStatus } = await requireAuthenticatedUser(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: authStatus || 401 });
    }

    const body = await request.json();
    const { code, subtotal } = body;

    if (!code || typeof code !== "string" || subtotal === undefined) {
      return NextResponse.json({ error: "Coupon code and subtotal are required" }, { status: 400 });
    }

    const quote = quoteCoupon(code, Number(subtotal) || 0);
    if (quote.error) {
      return NextResponse.json({ error: quote.error }, { status: quote.status });
    }

    return NextResponse.json({
      valid: true,
      code: quote.code,
      description: quote.description,
      discountAmount: quote.discount,
      finalSubtotal: Math.max(0, (Number(subtotal) || 0) - quote.discount),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
