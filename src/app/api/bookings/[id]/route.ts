import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authentication" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
    }

    const { id } = await params;
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .eq("user_id", authData.user.id)
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


