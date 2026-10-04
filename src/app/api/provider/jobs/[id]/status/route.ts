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
    const body = await request.json();
    const { status: targetStatus, beforeImages, afterImages, serviceNotes } = body;

    if (!targetStatus) {
      return NextResponse.json(
        { error: "status field is required" },
        { status: 400 }
      );
    }

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from("bookings")
      .select("id, user_id, status, assigned_provider_id")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.assigned_provider_id !== provider.id) {
      return NextResponse.json({ error: "Forbidden: Booking not assigned to you" }, { status: 403 });
    }

    const currentStatus = booking.status;
    
    // State machine definition
    const allowedTransitions: Record<string, string[]> = {
      "accepted": ["arrived"],
      "assigned": ["arrived"], // For compatibility if renamed
      "arrived": ["in_progress"],
      "in_progress": ["completed"]
    };

    if (!allowedTransitions[currentStatus]?.includes(targetStatus)) {
      return NextResponse.json(
        { error: `Invalid state transition from ${currentStatus} to ${targetStatus}` },
        { status: 422 }
      );
    }

    if (targetStatus === 'arrived') {
      // Arrival Geofence Validation
      const { data: locationData, error: locationError } = await supabaseAdmin
        .from("bookings")
        .select(`
          location_snapshot,
          providers ( current_lat, current_lng, updated_at )
        `)
        .eq("id", bookingId)
        .single();

      if (locationError || !locationData) {
        return NextResponse.json({ error: "Could not fetch location data for validation" }, { status: 500 });
      }

      const providerLocation = Array.isArray(locationData.providers) ? locationData.providers[0] : locationData.providers;
      if (!providerLocation || !providerLocation.current_lat || !providerLocation.current_lng) {
        return NextResponse.json({ error: "Technician location is unavailable. Ensure GPS is active." }, { status: 422 });
      }
      
      // Check for stale location (e.g. older than 5 minutes)
      const lastUpdated = new Date(providerLocation.updated_at).getTime();
      if (Date.now() - lastUpdated > 5 * 60 * 1000) {
         return NextResponse.json({ error: "Technician GPS location is stale. Please wait for a fresh GPS lock." }, { status: 422 });
      }

      const destLat = (locationData.location_snapshot as any)?.latitude;
      const destLng = (locationData.location_snapshot as any)?.longitude;

      if (!destLat || !destLng) {
        return NextResponse.json({ error: "Booking destination coordinates are missing." }, { status: 422 });
      }

      // Haversine distance formula
      const R = 6371e3; // Earth radius in meters
      const φ1 = providerLocation.current_lat * Math.PI / 180;
      const φ2 = destLat * Math.PI / 180;
      const Δφ = (destLat - providerLocation.current_lat) * Math.PI / 180;
      const Δλ = (destLng - providerLocation.current_lng) * Math.PI / 180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      // Threshold: 500 meters
      if (distance > 500) {
        return NextResponse.json(
          { error: `You are too far from the destination (${Math.round(distance)}m). You must be within 500m to mark as arrived.` },
          { status: 422 }
        );
      }
    }

    if (targetStatus === 'completed') {
      const isValid = Array.isArray(beforeImages) && beforeImages.length >= 1 &&
                      Array.isArray(afterImages) && afterImages.length >= 1 &&
                      typeof serviceNotes === 'string' && serviceNotes.trim().length > 0;
      
      if (!isValid) {
        return NextResponse.json(
          { error: "Completion evidence is incomplete. beforeImages, afterImages, and serviceNotes are required." },
          { status: 400 }
        );
      }
    }

    const updates: Record<string, any> = {
      status: targetStatus,
      updated_at: new Date().toISOString(),
    };

    if (beforeImages || afterImages || serviceNotes) {
      updates.service_proof = {
        beforeImages: beforeImages || [],
        afterImages: afterImages || [],
        serviceNotes: serviceNotes || "",
        updatedAt: new Date().toISOString(),
      };
    }

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update(updates)
      .eq("id", bookingId)
      .eq("status", currentStatus) // concurrency protection
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Conflict: Booking state changed concurrently" }, { status: 409 });
    }

    // Trigger Notification
    if (targetStatus === 'arrived') notifyBookingEvent(booking.user_id, 'TECHNICIAN_ARRIVED', bookingId);
    if (targetStatus === 'in_progress') notifyBookingEvent(booking.user_id, 'SERVICE_STARTED', bookingId);
    if (targetStatus === 'completed') notifyBookingEvent(booking.user_id, 'SERVICE_COMPLETED', bookingId);

    return NextResponse.json({
      success: true,
      booking: {
        id: data.id,
        status: data.status,
        assignedProviderId: data.assigned_provider_id,
        paymentStatus: data.payment_status,
        serviceProof: data.service_proof,
        updatedAt: data.updated_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
