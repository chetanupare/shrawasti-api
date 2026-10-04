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
      return NextResponse.json({ error: authError || "Authentication required" }, { status: authStatus || 401 });
    }

    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isOwner =
      data.user_id === user.id ||
      (user.raw_uid && data.user_id === user.raw_uid) ||
      data.assigned_provider_id === user.id ||
      (user.raw_uid && data.assigned_provider_id === user.raw_uid);

    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden: Cannot access this booking" }, { status: 403 });
    }

    return NextResponse.json({
      booking: {
        id: data.id,
        userId: data.user_id,
        vehicleId: data.vehicle_id,
        assignedProviderId: data.assigned_provider_id,
        locationSnapshot: data.location_snapshot,
        vehicleSnapshot: data.vehicle_snapshot,
        services: data.services,
        scheduleDate: data.schedule_date,
        scheduleTime: data.schedule_time,
        paymentMethod: data.payment_method,
        paymentStatus: data.payment_status,
        subtotal: data.subtotal,
        discount: data.discount,
        total: data.total,
        status: data.status,
        idempotencyKey: data.idempotency_key,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
