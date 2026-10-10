import { NextResponse } from "next/server";
import { isProviderAccountBlocked, requireProviderUser } from "@/lib/auth";
import { notifyBookingEvent } from "@/lib/notifications";
import { acceptOpenJob } from "@/lib/jobAccept";

export async function POST(request: Request) {
  try {
    const { error: authError, status: authStatus, provider } = await requireProviderUser(request);
    if (authError || !provider) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    // Check if provider is active
    if (isProviderAccountBlocked(provider.status)) {
      return NextResponse.json(
        { error: "Provider account is inactive" },
        { status: 422 }
      );
    }

    const { data, error, status } = await acceptOpenJob(bookingId, provider.id);

    if (error || !data) {
      return NextResponse.json({ error: error || "This job is not available" }, { status });
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
