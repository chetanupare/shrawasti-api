import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { quoteCoupon } from "@/lib/coupons";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("coupons")
      .select("id, code, description, discount_type, discount_value, min_order_amount, max_discount_amount, is_active")
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

    const quote = await quoteCoupon(code, Number(subtotal) || 0);
    if (quote.error) {
      return NextResponse.json({
        valid: false,
        code: quote.code,
        discount: 0,
        finalTotal: Number(subtotal) || 0,
        message: quote.error,
      }, { status: quote.status === 500 ? 500 : 200 });
    }

    return NextResponse.json({
      valid: quote.discount > 0,
      code: quote.code,
      discount: quote.discount,
      finalTotal: Math.max((Number(subtotal) || 0) - quote.discount, 0),
      message: quote.description || "Coupon applied",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
