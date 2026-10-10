import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createRazorpayOrderForBooking } from "@/lib/razorpayOrder";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || "Authentication required" }, { status: authStatus || 401 });
    }

    const { id: bookingId } = await params;
    const body = await request.json();
    const action = body.action === "cash" ? "cash" : body.action === "retry" ? "retry" : null;
    if (!action) {
      return NextResponse.json({ error: "Choose retry or cash" }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("id, user_id, status, payment_status, payment_method, total")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const ownsBooking =
      booking.user_id === user.id || (user.raw_uid && booking.user_id === user.raw_uid);
    if (!ownsBooking) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.payment_status === "paid" || booking.status === "cancelled") {
      return NextResponse.json(
        { error: "This booking can no longer be paid from checkout" },
        { status: 422 }
      );
    }

    if (action === "cash") {
      const { data, error } = await supabaseAdmin
        .from("bookings")
        .update({
          payment_method: "cash",
          status: "confirmed",
          payment_status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId)
        .select("id, status, payment_status, payment_method, total")
        .single();

      if (error || !data) {
        return NextResponse.json({ error: error?.message || "Could not switch to cash" }, { status: 500 });
      }

      return NextResponse.json({
        booking: {
          id: data.id,
          status: data.status,
          paymentStatus: data.payment_status,
          paymentMethod: data.payment_method,
          total: data.total,
        },
      });
    }

    const amount = Number(booking.total);
    const created = await createRazorpayOrderForBooking({
      bookingId,
      userId: booking.user_id,
      amount,
      method: booking.payment_method || "online",
    });

    if (created.error || !created.razorpayOrder) {
      return NextResponse.json({ error: created.error || "Could not start payment" }, { status: 502 });
    }

    return NextResponse.json({ razorpayOrder: created.razorpayOrder });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
