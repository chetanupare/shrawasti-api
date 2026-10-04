import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuthenticatedUser } from "@/lib/auth";
import { notifyBookingEvent } from "@/lib/notifications";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const { id: bookingId } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json({ error: "Cancellation reason is required" }, { status: 400 });
    }

    if (reason.length > 1000) {
      return NextResponse.json({ error: "Cancellation reason is too long" }, { status: 400 });
    }

    // Load the booking to verify ownership and state
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from("bookings")
      .select("id, user_id, status")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify ownership or admin role
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    if (booking.user_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: Cannot cancel another user's booking" }, { status: 403 });
    }

    // Verify current state
    const allowedStatesForCustomer = ["confirmed", "accepted", "assigned"];
    const allowedStatesForAdmin = ["pending", "confirmed", "accepted", "assigned"];

    const allowedStates = isAdmin ? allowedStatesForAdmin : allowedStatesForCustomer;

    if (!allowedStates.includes(booking.status)) {
      return NextResponse.json(
        { error: `Cannot cancel booking in '${booking.status}' state.` },
        { status: 422 }
      );
    }

    // Atomically transition the booking
    const updates = {
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
      cancellation_reason: reason || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update(updates)
      .eq("id", bookingId)
      .eq("status", booking.status) // concurrency check
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Conflict: Booking state changed concurrently" },
        { status: 409 }
      );
    }

    // Trigger Notification
    notifyBookingEvent(data.user_id, 'BOOKING_CANCELLED', bookingId);

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully",
      booking: data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
