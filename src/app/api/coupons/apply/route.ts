import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";

const COUPONS: Record<string, {
  type: "flat" | "percent";
  value: number;
  maxDiscount?: number;
  minOrder: number;
  description: string;
}> = {
  SHRAWASTI100: {
    type: "flat",
    value: 100,
    minOrder: 499,
    description: "₹100 Flat Discount on orders above ₹499",
  },
  WELCOME50: {
    type: "flat",
    value: 50,
    minOrder: 249,
    description: "₹50 Flat Discount on welcome order",
  },
  FESTIVE20: {
    type: "percent",
    value: 20,
    maxDiscount: 200,
    minOrder: 399,
    description: "20% OFF up to ₹200 on orders above ₹399",
  },
  CLEAN20: {
    type: "percent",
    value: 20,
    maxDiscount: 150,
    minOrder: 299,
    description: "20% OFF up to ₹150 on orders above ₹299",
  },
};

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

    const cleanCode = code.trim().toUpperCase();
    const coupon = COUPONS[cleanCode];

    if (!coupon) {
      return NextResponse.json({ error: "Invalid coupon code. Try WELCOME50 or SHRAWASTI100" }, { status: 404 });
    }

    const orderSubtotal = Number(subtotal) || 0;
    if (orderSubtotal < coupon.minOrder) {
      return NextResponse.json(
        { error: `Coupon requires a minimum order of ₹${coupon.minOrder}` },
        { status: 422 }
      );
    }

    let discount = 0;
    if (coupon.type === "flat") {
      discount = coupon.value;
    } else if (coupon.type === "percent") {
      discount = Math.round((orderSubtotal * coupon.value) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    }

    discount = Math.min(discount, orderSubtotal);

    return NextResponse.json({
      valid: true,
      code: cleanCode,
      description: coupon.description,
      discountAmount: discount,
      finalSubtotal: Math.max(0, orderSubtotal - discount),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
