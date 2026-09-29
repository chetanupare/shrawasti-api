import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const DEFAULT_COUPONS = [
  {
    code: "WELCOME10",
    discountPercentage: 10,
    maxDiscount: 100,
    minOrderAmount: 299,
    description: "Get 10% off on your first vehicle wash",
  },
  {
    code: "SHRAWASTI50",
    discountFlat: 50,
    minOrderAmount: 499,
    description: "Flat ₹50 off on orders above ₹499",
  },
];

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("is_active", true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ coupons: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, subtotal } = body;

    if (!code || subtotal === undefined) {
      return NextResponse.json({ error: "code and subtotal are required" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // Check DB first for dynamic coupon
    const { data: dbCoupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", cleanCode)
      .eq("is_active", true)
      .maybeSingle();

    let discount = 0;
    let valid = false;
    let message = "";

    if (dbCoupon) {
      const minOrder = dbCoupon.min_order_amount || 0;
      if (subtotal >= minOrder) {
        if (dbCoupon.discount_percentage) {
          const calc = Math.round((subtotal * dbCoupon.discount_percentage) / 100);
          discount = dbCoupon.max_discount ? Math.min(calc, dbCoupon.max_discount) : calc;
        } else if (dbCoupon.discount_flat) {
          discount = dbCoupon.discount_flat;
        }
        valid = true;
        message = dbCoupon.description || `Coupon ${cleanCode} applied successfully!`;
      } else {
        message = `Minimum order amount of ₹${minOrder} required for ${cleanCode}`;
      }
    } else if (cleanCode === "WELCOME10") {
      if (subtotal >= 299) {
        discount = Math.min(Math.round(subtotal * 0.1), 100);
        valid = true;
        message = "10% Welcome Discount applied!";
      } else {
        message = "Minimum subtotal of ₹299 required for WELCOME10";
      }
    } else if (cleanCode === "SHRAWASTI50") {
      if (subtotal >= 499) {
        discount = 50;
        valid = true;
        message = "Flat ₹50 discount applied!";
      } else {
        message = "Minimum subtotal of ₹499 required for SHRAWASTI50";
      }
    } else {
      message = "Invalid coupon code";
    }

    return NextResponse.json({
      valid,
      code: cleanCode,
      discount,
      finalTotal: Math.max(subtotal - discount, 0),
      message,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
