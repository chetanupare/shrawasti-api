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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, userId, razorpayOrderId, razorpayPaymentId, amount, method, status } = body;

    if (!bookingId || !userId || !amount || !method || !status) {
      return NextResponse.json(
        { error: "Missing required payment fields (bookingId, userId, amount, method, status)" },
        { status: 400 }
      );
    }

    const paymentRecord = {
      booking_id: bookingId,
      user_id: userId,
      razorpay_order_id: razorpayOrderId || null,
      razorpay_payment_id: razorpayPaymentId || null,
      amount,
      method,
      status,
    };

    const { data, error } = await supabase
      .from("payments")
      .insert(paymentRecord)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        payment: {
          id: data.id,
          bookingId: data.booking_id,
          userId: data.user_id,
          razorpayOrderId: data.razorpay_order_id,
          razorpayPaymentId: data.razorpay_payment_id,
          amount: data.amount,
          method: data.method,
          status: data.status,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
