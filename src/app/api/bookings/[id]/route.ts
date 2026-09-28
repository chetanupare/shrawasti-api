import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, paymentStatus } = body;

    const updates: Record<string, any> = {};
    if (status !== undefined) updates.status = status;
    if (paymentStatus !== undefined) updates.payment_status = paymentStatus;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No status updates provided" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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
