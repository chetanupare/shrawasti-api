import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireProviderUser } from "@/lib/auth";
import { notifyBookingEvent } from "@/lib/notifications";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError, status: authStatus, provider } = await requireProviderUser(request);
    if (authError || !provider) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const { id: bookingId } = await params;
    
    // Check if provider is active
    if (provider.status !== "active") {
      return NextResponse.json(
        { error: "Provider account is inactive" },
        { status: 422 }
      );
    }

    const updates = {
      assigned_provider_id: provider.id,
      status: "accepted",
      updated_at: new Date().toISOString(),
    };

    // Concurrency protection: Booking must be unassigned or in pending/confirmed state
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update(updates)
      .eq("id", bookingId)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Conflict: Booking is no longer available or has already been accepted" },
        { status: 409 }
      );
    }

    // Trigger Notifications
    try {
      if (data.user_id) {
        notifyBookingEvent(data.user_id, 'TECHNICIAN_ASSIGNED', bookingId);
      }
      notifyBookingEvent(provider.id, 'NEW_JOB_ASSIGNED', bookingId);
    } catch (e) {
      console.warn('[Notification error on job accept]:', e);
    }

    return NextResponse.json({
      success: true,
      message: "Job accepted successfully",
      booking: {
        id: data.id,
        userId: data.user_id,
        locationSnapshot: data.location_snapshot,
        vehicleSnapshot: data.vehicle_snapshot,
        services: data.services,
        scheduleDate: data.schedule_date,
        scheduleTime: data.schedule_time,
        paymentMethod: data.payment_method,
        paymentStatus: data.payment_status,
        total: data.total,
        status: data.status,
        assignedProviderId: data.assigned_provider_id,
        updatedAt: data.updated_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
