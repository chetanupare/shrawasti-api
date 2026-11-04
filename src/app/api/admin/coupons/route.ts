import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdminUser } from "@/lib/auth";

function mapCoupon(row: any) {
  return {
    id: row.id,
    code: row.code,
    description: row.description || "",
    discountType: row.discount_type || "fixed",
    discountValue: Number(row.discount_value) || 0,
    minOrderAmount: Number(row.min_order_amount) || 0,
    maxDiscountAmount: Number(row.max_discount_amount) || 0,
    maxRedemptions: row.max_redemptions,
    timesRedeemed: Number(row.times_redeemed) || 0,
    isActive: row.is_active !== false,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export async function GET(request: Request) {
  try {
    const { error: authError, status: authStatus } = await requireAdminUser(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const { data, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ coupons: (data || []).map(mapCoupon) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { error: authError, status: authStatus } = await requireAdminUser(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const body = await request.json();
    const code = String(body.code || "").trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const discountType = String(body.discountType || "fixed").toLowerCase() === "percentage" ? "percentage" : "fixed";
    const row = {
      id: crypto.randomUUID(),
      code,
      description: body.description || "",
      discount_type: discountType,
      discount_value: Number(body.discountValue) || 0,
      min_order_amount: Number(body.minOrderAmount) || 0,
      max_discount_amount: Number(body.maxDiscountAmount) || 0,
      max_redemptions: Number(body.maxRedemptions) || 100,
      times_redeemed: 0,
      is_active: body.isActive !== false,
    };

    const { data, error } = await supabaseAdmin.from("coupons").insert(row).select("*").single();
    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Could not create coupon" }, { status: 500 });
    }

    return NextResponse.json({ coupon: mapCoupon(data) }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { error: authError, status: authStatus } = await requireAdminUser(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Coupon ID is required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (body.code !== undefined) updates.code = String(body.code).trim().toUpperCase();
    if (body.description !== undefined) updates.description = body.description;
    if (body.discountType !== undefined) {
      updates.discount_type = String(body.discountType).toLowerCase() === "percentage" ? "percentage" : "fixed";
    }
    if (body.discountValue !== undefined) updates.discount_value = Number(body.discountValue) || 0;
    if (body.minOrderAmount !== undefined) updates.min_order_amount = Number(body.minOrderAmount) || 0;
    if (body.maxDiscountAmount !== undefined) updates.max_discount_amount = Number(body.maxDiscountAmount) || 0;
    if (body.maxRedemptions !== undefined) updates.max_redemptions = Number(body.maxRedemptions) || 0;
    if (body.isActive !== undefined) updates.is_active = Boolean(body.isActive);

    const { data, error } = await supabaseAdmin
      .from("coupons")
      .update(updates)
      .eq("id", body.id)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Coupon not found" }, { status: error ? 500 : 404 });
    }

    return NextResponse.json({ coupon: mapCoupon(data) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { error: authError, status: authStatus } = await requireAdminUser(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const id = new URL(request.url).searchParams.get("id");
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
