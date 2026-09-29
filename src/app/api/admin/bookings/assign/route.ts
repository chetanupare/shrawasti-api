import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, providerId } = body;

    if (!bookingId || !providerId) {
      return NextResponse.json(
        { error: "bookingId and providerId fields are required" },
        { status: 400 }
      );
    }

    const updates = {
      assigned_provider_id: providerId,
      status: "accepted",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update(updates)
      .eq("id", bookingId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const assignedBooking = {
      id: data.id,
      assignedProviderId: data.assigned_provider_id,
      locationSnapshot: data.location_snapshot,
      vehicleSnapshot: data.vehicle_snapshot,
      services: data.services,
      status: data.status,
      updatedAt: data.updated_at,
    };

    // Trigger push notification to assigned provider
    const { notifyProviderJobAssigned } = await import("@/lib/notifications");
    notifyProviderJobAssigned(providerId, assignedBooking).catch((err) =>
      console.error("Failed to notify assigned provider:", err)
    );

    return NextResponse.json({
      success: true,
      message: "Serviceman assigned successfully to booking",
      booking: assignedBooking,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
