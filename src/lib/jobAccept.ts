import { supabaseAdmin } from "@/lib/supabase";

const COLLECT_ON_ARRIVAL = ["cash", "after_service"];

/** Paid online jobs, and cash jobs that are confirmed but not yet paid. */
export function isOpenForTechnician(booking: {
  status?: string | null;
  payment_method?: string | null;
  payment_status?: string | null;
  assigned_provider_id?: string | null;
}) {
  if (booking.assigned_provider_id) return false;
  if (booking.status !== "confirmed") return false;
  if (booking.payment_status === "paid") return true;
  return COLLECT_ON_ARRIVAL.includes(String(booking.payment_method || "").toLowerCase());
}

export function openJobRefusal(booking: {
  status?: string | null;
  payment_method?: string | null;
  payment_status?: string | null;
  assigned_provider_id?: string | null;
} | null) {
  if (!booking) return { error: "Booking not found", status: 404 };
  if (booking.assigned_provider_id) {
    return { error: "Conflict: Booking has already been accepted", status: 409 };
  }
  if (booking.status === "cancelled") {
    return { error: "Cancelled bookings cannot be accepted", status: 422 };
  }
  const collectOnArrival = COLLECT_ON_ARRIVAL.includes(String(booking.payment_method || "").toLowerCase());
  if (booking.status !== "confirmed" || (booking.payment_status !== "paid" && !collectOnArrival)) {
    return { error: "Unpaid online bookings cannot be accepted", status: 422 };
  }
  return { error: "This job is not available", status: 409 };
}

export async function acceptOpenJob(bookingId: string, providerId: string) {
  const updates = {
    assigned_provider_id: providerId,
    status: "accepted",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .update(updates)
    .eq("id", bookingId)
    .is("assigned_provider_id", null)
    .eq("status", "confirmed")
    .or("payment_status.eq.paid,payment_method.ilike.cash,payment_method.ilike.after_service")
    .select()
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message, status: 500 };
  }

  if (!data) {
    const { data: current } = await supabaseAdmin
      .from("bookings")
      .select("status, payment_method, payment_status, assigned_provider_id")
      .eq("id", bookingId)
      .maybeSingle();
    const refusal = openJobRefusal(current);
    return { data: null, error: refusal.error, status: refusal.status };
  }

  return { data, error: null, status: 200 };
}
