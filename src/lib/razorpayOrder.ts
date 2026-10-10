import { supabaseAdmin } from "@/lib/supabase";

export async function createRazorpayOrderForBooking(input: {
  bookingId: string;
  userId: string;
  amount: number;
  method: string;
}) {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return { error: "Razorpay is not configured", razorpayOrder: null };
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { error: "This booking has nothing to charge", razorpayOrder: null };
  }

  const authBase64 = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${authBase64}` },
    body: JSON.stringify({
      amount: Math.round(input.amount * 100),
      currency: "INR",
      receipt: input.bookingId.substring(0, 40),
      notes: { bookingId: input.bookingId },
    }),
  });

  if (!orderRes.ok) {
    const detail = await orderRes.text();
    return { error: detail || "Could not create Razorpay order", razorpayOrder: null };
  }

  const razorpayOrder = await orderRes.json();
  const { error } = await supabaseAdmin.from("payments").insert({
    booking_id: input.bookingId,
    user_id: input.userId,
    razorpay_order_id: razorpayOrder.id,
    amount: input.amount,
    method: input.method || "online",
    status: "pending",
  });

  if (error) {
    return { error: error.message, razorpayOrder: null };
  }

  return {
    error: null,
    razorpayOrder: {
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId,
    },
  };
}
