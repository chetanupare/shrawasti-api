import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdminUser } from "@/lib/auth";
import { notifyBookingEvent } from "@/lib/notifications";

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

    if (providerError || !providerData || providerData.status !== "active") {
      return NextResponse.json(
        { error: "Provider not found or inactive" },
        { status: 422 }
      );
    }

    // Assigning requires booking to be confirmed
    const updates = {
      assigned_provider_id: providerId,
      status: "accepted", // maps to ASSIGNED
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update(updates)
      .eq("id", bookingId)
      .eq("status", "confirmed") // concurrency protection & state check
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Conflict: Booking not in confirmed state or changed concurrently" },
        { status: 409 }
      );
    }

    // Trigger Notification
    notifyBookingEvent(data.user_id, 'TECHNICIAN_ASSIGNED', bookingId);
    notifyBookingEvent(providerId, 'NEW_JOB_ASSIGNED', bookingId);

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
