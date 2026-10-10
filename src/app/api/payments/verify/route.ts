import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuthenticatedUser } from "@/lib/auth";
import { notifyBookingEvent } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || "Authentication required" }, { status: authStatus || 401 });
    }

    const body = await request.json();
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Missing required payment verification details" }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: "Razorpay key secret not configured on server" }, { status: 500 });
    }

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return NextResponse.json({ error: "Invalid payment signature verification failed" }, { status: 400 });
    }

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("id, booking_id, user_id, amount, status")
      .eq("razorpay_order_id", razorpayOrderId)
      .maybeSingle();

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment order was not found" }, { status: 404 });
    }

    if (payment.booking_id !== bookingId) {
      return NextResponse.json({ error: "Payment does not match this booking" }, { status: 400 });
    }

    const ownerIds = [user.id, user.raw_uid].filter(Boolean);
    if (!ownerIds.includes(payment.user_id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: booking, error: bookingLookupError } = await supabaseAdmin
      .from("bookings")
      .select("id, user_id, status, total, payment_status")
      .eq("id", bookingId)
      .single();

    if (bookingLookupError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (Math.round(Number(payment.amount)) !== Math.round(Number(booking.total))) {
      return NextResponse.json({ error: "Paid amount does not match the booking total" }, { status: 400 });
    }

    if (payment.status !== "paid") {
      const { error: updatePaymentError } = await supabaseAdmin
        .from("payments")
        .update({
          status: "paid",
          razorpay_payment_id: razorpayPaymentId,
        })
        .eq("id", payment.id);

      if (updatePaymentError) {
        return NextResponse.json({ error: updatePaymentError.message }, { status: 500 });
      }
    }

    const bookingUpdate: Record<string, string> = {
      payment_status: "paid",
      updated_at: new Date().toISOString(),
    };
    if (booking.status === "pending") {
      bookingUpdate.status = "confirmed";
    }

    const { data: updatedBooking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .update(bookingUpdate)
      .eq("id", bookingId)
      .select("id, status, payment_status, user_id")
      .single();

    if (bookingError || !updatedBooking) {
      return NextResponse.json({ error: "Failed to update booking status" }, { status: 500 });
    }

    if (booking.status === "pending") {
      notifyBookingEvent(updatedBooking.user_id, "BOOKING_CONFIRMED", bookingId);
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and booking confirmed",
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status,
        paymentStatus: updatedBooking.payment_status,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
