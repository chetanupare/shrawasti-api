import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const bookingId = searchParams.get("bookingId");

    if (!userId && !bookingId) {
      return NextResponse.json(
        { error: "userId or bookingId parameter is required" },
        { status: 400 }
      );
    }

    let query = supabase.from("payments").select("*");

    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (bookingId) {
      query = query.eq("booking_id", bookingId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const payments = (data || []).map((p: any) => ({
      id: p.id,
      bookingId: p.booking_id,
      userId: p.user_id,
      razorpayOrderId: p.razorpay_order_id,
      razorpayPaymentId: p.razorpay_payment_id,
      amount: p.amount,
      method: p.method,
      status: p.status,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return NextResponse.json({ payments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


