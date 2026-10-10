import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isProviderAccountBlocked, requireAdminUser } from "@/lib/auth";
import { notifyBookingEvent } from "@/lib/notifications";
import { isOpenForTechnician } from "@/lib/jobAccept";

export async function POST(request: Request) {
  try {
    const { error: authError, status: authStatus } = await requireAdminUser(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const body = await request.json();
    const { bookingId, providerId } = body;

    if (!bookingId || !providerId) {
      return NextResponse.json(
        { error: "bookingId and providerId fields are required" },
        { status: 400 }
      );
    }

    // Verify provider is active
    const { data: providerData, error: providerError } = await supabaseAdmin
      .from("providers")
      .select("id, status")
      .eq("id", providerId)
      .single();

    if (providerError || !providerData || isProviderAccountBlocked(providerData.status)) {
      return NextResponse.json(
        { error: "Provider not found or inactive" },
        { status: 422 }
      );
    }

    // Fetch booking to verify current state
    const { data: bookingCheck, error: bCheckError } = await supabaseAdmin
      .from("bookings")
      .select("id, user_id, status, assigned_provider_id, payment_method, payment_status")
      .eq("id", bookingId)
      .single();

    if (bCheckError || !bookingCheck) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const allowedStatesToAssign = ["confirmed", "accepted", "assigned"];
    if (!allowedStatesToAssign.includes(bookingCheck.status)) {
      return NextResponse.json(
        { error: `Cannot assign provider to booking in '${bookingCheck.status}' state` },
        { status: 422 }
      );
    }

    if (!bookingCheck.assigned_provider_id && !isOpenForTechnician(bookingCheck)) {
      return NextResponse.json(
        { error: "Unpaid online bookings and cancelled bookings cannot be assigned" },
        { status: 422 }
      );
    }

    const oldProviderId = bookingCheck.assigned_provider_id;

    // Assigning updates assigned_provider_id and sets status to accepted
    const updates = {
      assigned_provider_id: providerId,
      status: "accepted",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update(updates)
      .eq("id", bookingId)
      .eq("status", bookingCheck.status) // concurrency protection
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

    // Trigger Notifications
    notifyBookingEvent(data.user_id, 'TECHNICIAN_ASSIGNED', bookingId);
    notifyBookingEvent(providerId, 'NEW_JOB_ASSIGNED', bookingId);
    if (oldProviderId && oldProviderId !== providerId) {
      notifyBookingEvent(oldProviderId, 'BOOKING_CANCELLED', bookingId);
    }

    return NextResponse.json({
      success: true,
      message: "Serviceman assigned successfully to booking",
      booking: {
        id: data.id,
        assignedProviderId: data.assigned_provider_id,
        status: data.status,
        updatedAt: data.updated_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
