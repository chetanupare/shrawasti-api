import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuthenticatedUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const { id: bookingId } = await params;

    // 1. Verify booking ownership and state
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from("bookings")
      .select("id, user_id, status, assigned_provider_id")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: Cannot access another user's booking" }, { status: 403 });
    }

    // 2. Verify tracking is allowed in the current state
    const trackingStates = ["accepted", "assigned", "arrived", "in_progress"];
    if (!trackingStates.includes(booking.status)) {
      return NextResponse.json(
        { error: `Location tracking unavailable for booking in '${booking.status}' state.` },
        { status: 422 }
      );
    }

    if (!booking.assigned_provider_id) {
      return NextResponse.json({ error: "No technician assigned to this booking" }, { status: 422 });
    }

    // 3. Fetch latest location snapshot
    const { data: provider, error: providerError } = await supabaseAdmin
      .from("providers")
      .select("id, name, current_lat, current_lng, heading, speed, updated_at")
      .eq("id", booking.assigned_provider_id)
      .single();

    if (providerError || !provider) {
      return NextResponse.json({ error: "Technician location unavailable" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      location: {
        latitude: provider.current_lat,
        longitude: provider.current_lng,
        heading: provider.heading,
        speed: provider.speed,
        updatedAt: provider.updated_at,
      },
      provider: {
        name: provider.name
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
