import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { markCarePassPaid } from "@/lib/carePass";

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error("Missing RAZORPAY_WEBHOOK_SECRET in environment");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const rawBody = await request.text();

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === "payment.captured") {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      const amountPaid = paymentEntity.amount / 100; // paise to INR
      const currency = paymentEntity.currency;

      if (!orderId) {
         return NextResponse.json({ error: "Missing order_id in webhook" }, { status: 400 });
      }

      // 1. Find the payment record
      const { data: paymentRecord, error: paymentError } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("razorpay_order_id", orderId)
        .single();

      if (paymentError || !paymentRecord) {
        const carePass = await markCarePassPaid({
          orderId,
          paymentId,
          amountPaid,
        });
        if (!carePass.error) {
          return NextResponse.json({ received: true, subscriptionId: carePass.subscriptionId }, { status: 200 });
        }
        if (carePass.status !== 404) {
          return NextResponse.json({ error: carePass.error }, { status: carePass.status });
        }
        console.error("Payment record not found for order:", orderId);
        return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
      }

      // 2. Check Idempotency (Already paid?)
      if (paymentRecord.status === "paid") {
        return NextResponse.json({ message: "Already processed" }, { status: 200 });
      }

      // 3. Amount and currency validation
      if (Math.round(paymentRecord.amount) !== Math.round(amountPaid)) {
        await supabaseAdmin.from("payments").update({ status: "failed" }).eq("id", paymentRecord.id);
        return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
      }
      
      if (currency !== "INR") {
         await supabaseAdmin.from("payments").update({ status: "failed" }).eq("id", paymentRecord.id);
         return NextResponse.json({ error: "Currency mismatch" }, { status: 400 });
      }

      // 4. Update payment to successful
      const { error: updatePaymentError } = await supabaseAdmin
        .from("payments")
        .update({
          status: "paid",
          razorpay_payment_id: paymentId,
        })
        .eq("id", paymentRecord.id);

      if (updatePaymentError) {
        throw new Error("Failed to update payment status");
      }

      // 5. Update booking to confirmed only if it's currently pending
      // If it's cancelled, we update payment_status but DO NOT resurrect the booking status.
      const { data: booking, error: fetchBookingError } = await supabaseAdmin
        .from("bookings")
        .select("status")
        .eq("id", paymentRecord.booking_id)
        .single();
        
      if (fetchBookingError || !booking) {
        throw new Error("Failed to fetch booking for webhook");
      }

      const bookingUpdate: Record<string, string> = { payment_status: "paid" };
      if (booking.status === "pending") {
        bookingUpdate.status = "confirmed";
      }

      const { error: updateBookingError } = await supabaseAdmin
        .from("bookings")
        .update(bookingUpdate)
        .eq("id", paymentRecord.booking_id);

      if (updateBookingError) {
        throw new Error("Failed to confirm booking");
      }

      // Notify only when this payment is what confirms a still-pending booking.
      if (booking.status === "pending") {
        const { notifyBookingEvent } = require("@/lib/notifications");
        notifyBookingEvent(paymentRecord.user_id, 'BOOKING_CONFIRMED', paymentRecord.booking_id);
      }
    }
    
    if (event.event === "payment.failed") {
       const paymentEntity = event.payload.payment.entity;
       const orderId = paymentEntity.order_id;
       if (orderId) {
         await supabaseAdmin.from("payments").update({ status: "failed" }).eq("razorpay_order_id", orderId);
         const { data: carePassPayment } = await supabaseAdmin
           .from("subscription_payments")
           .select("id, subscription_id")
           .eq("gateway_order_id", orderId)
           .maybeSingle();
         if (carePassPayment) {
           await supabaseAdmin.from("subscription_payments").update({ status: "failed" }).eq("id", carePassPayment.id);
           await supabaseAdmin.from("user_subscriptions").update({ status: "payment_failed" }).eq("id", carePassPayment.subscription_id).eq("status", "pending");
         }
       }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
