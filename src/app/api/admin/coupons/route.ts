import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from("coupons").select("*").order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const coupons = (data || []).map((c: any) => ({
      id: c.id,
      code: c.code,
      description: c.description || "",
      discountType: c.discount_type || c.discountType || "fixed",
      discountValue: Number(c.discount_value || c.discountValue || 0),
      minOrderAmount: Number(c.min_order_amount || c.minOrderAmount || 0),
      maxDiscountAmount: Number(c.max_discount_amount || c.maxDiscountAmount || 1000),
      maxRedemptions: c.max_redemptions || c.maxRedemptions || 100,
      timesRedeemed: c.times_redeemed || c.timesRedeemed || 0,
      isActive: c.is_active ?? true,
      createdAt: c.created_at,
    }));

    return NextResponse.json({ coupons });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, description, discountType, discountValue, minOrderAmount, maxDiscountAmount, maxRedemptions, isActive } = body;

    if (!code || !discountValue) {
      return NextResponse.json({ error: "Coupon code and discountValue are required" }, { status: 400 });
    }

    const newCoupon = {
      code: code.trim().toUpperCase(),
      description: description || "",
      discount_type: discountType || "fixed",
      discount_value: parseFloat(discountValue),
      min_order_amount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
      max_discount_amount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : 1000,
      max_redemptions: maxRedemptions ? parseInt(maxRedemptions) : 100,
      is_active: isActive ?? true,
    };

    const { data, error } = await supabaseAdmin
      .from("coupons")
      .insert(newCoupon)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ coupon: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, code, description, discountType, discountValue, minOrderAmount, maxDiscountAmount, maxRedemptions, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Coupon ID is required" }, { status: 400 });
    }

    const updates: any = {};
    if (code !== undefined) updates.code = code.trim().toUpperCase();
    if (description !== undefined) updates.description = description;
    if (discountType !== undefined) updates.discount_type = discountType;
    if (discountValue !== undefined) updates.discount_value = parseFloat(discountValue);
    if (minOrderAmount !== undefined) updates.min_order_amount = parseFloat(minOrderAmount);
    if (maxDiscountAmount !== undefined) updates.max_discount_amount = parseFloat(maxDiscountAmount);
    if (maxRedemptions !== undefined) updates.max_redemptions = parseInt(maxRedemptions);
    if (isActive !== undefined) updates.is_active = isActive;

    const { data, error } = await supabaseAdmin
      .from("coupons")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, coupon: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");
    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: "Coupon ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("coupons").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
