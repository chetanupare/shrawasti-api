import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId");
    const status = searchParams.get("status");

    if (!providerId) {
      return NextResponse.json({ error: "providerId parameter is required" }, { status: 400 });
    }

    let query = supabase
      .from("bookings")
      .select("*")
      .eq("assigned_provider_id", providerId);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const assignedJobs = (data || []).map((b: any) => ({
      id: b.id,
      userId: b.user_id,
      vehicleId: b.vehicle_id,
      locationSnapshot: b.location_snapshot,
      vehicleSnapshot: b.vehicle_snapshot,
      services: b.services,
      scheduleDate: b.schedule_date,
      scheduleTime: b.schedule_time,
      paymentMethod: b.payment_method,
      paymentStatus: b.payment_status,
      subtotal: b.subtotal,
      discount: b.discount,
      total: b.total,
      status: b.status,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }));

    return NextResponse.json({ assignedJobs, count: assignedJobs.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
