import { supabaseAdmin } from "@/lib/supabase";

function razorpayAuth() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return { keyId, header: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}` };
}

async function razorpay(path: string, init?: RequestInit) {
  const auth = razorpayAuth();
  if (!auth) return { error: "Razorpay is not configured", data: null };
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: auth.header,
      ...(init?.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { error: data?.error?.description || "Could not create the payment QR", data: null };
  }
  return { error: null, data };
}

export async function collectionQrForBooking(booking: {
  id: string;
  user_id: string;
  total: number;
  payment_status: string | null;
  payment_method: string | null;
  status: string;
}) {
  if (booking.payment_status === "paid") {
    return { error: null, paid: true, imageUrl: null, amount: Number(booking.total) || 0 };
  }
  if (booking.status === "cancelled" || booking.status === "rejected") {
    return { error: "This booking cannot be collected", paid: false, imageUrl: null, amount: 0 };
  }
  const amount = Number(booking.total);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "This booking has nothing to collect", paid: false, imageUrl: null, amount: 0 };
  }

  const { data: pending } = await supabaseAdmin
    .from("payments")
    .select("id, razorpay_order_id, amount")
    .eq("booking_id", booking.id)
    .eq("status", "pending")
    .like("razorpay_order_id", "qr_%")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pending?.razorpay_order_id && Number(pending.amount) === amount) {
    const existing = await razorpay(`/payments/qr_codes/${pending.razorpay_order_id}`);
    if (existing.error) return { error: existing.error, paid: false, imageUrl: null, amount };
    if (existing.data?.status === "active" && existing.data?.image_url) {
      return { error: null, paid: false, imageUrl: existing.data.image_url as string, amount };
    }
  }

  const closeBy = Math.floor(Date.now() / 1000) + 2 * 60 * 60;
  const created = await razorpay("/payments/qr_codes", {
    method: "POST",
    body: JSON.stringify({
      type: "upi_qr",
      name: "Shrawasti Wash",
      usage: "single_use",
      fixed_amount: true,
      payment_amount: Math.round(amount * 100),
      description: "Doorstep wash payment",
      close_by: closeBy,
      notes: { bookingId: booking.id },
    }),
  });
  if (created.error || !created.data?.id || !created.data?.image_url) {
    return { error: created.error || "Could not create the payment QR", paid: false, imageUrl: null, amount };
  }

  const { error } = await supabaseAdmin.from("payments").insert({
    booking_id: booking.id,
    user_id: booking.user_id,
    razorpay_order_id: created.data.id,
    amount,
    method: "upi",
    status: "pending",
  });
  if (error) return { error: error.message, paid: false, imageUrl: null, amount };

  return { error: null, paid: false, imageUrl: created.data.image_url as string, amount };
}
