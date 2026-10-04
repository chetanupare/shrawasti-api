import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireProviderUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { error: authError, status: authStatus, provider } = await requireProviderUser(request);
    if (authError || !provider) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    // Unassigned bookings in 'pending' status
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "pending")
      .is("assigned_provider_id", null)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const availableJobs = (data || []).map((b: any) => ({
      id: b.id,
      userId: b.user_id,
      locationSnapshot: b.location_snapshot,
      vehicleSnapshot: b.vehicle_snapshot,
      services: b.services,
      scheduleDate: b.schedule_date,
      scheduleTime: b.schedule_time,
      paymentMethod: b.payment_method,
      paymentStatus: b.payment_status,
      total: b.total,
      status: b.status,
      createdAt: b.created_at,
    }));

    return NextResponse.json({ availableJobs, count: availableJobs.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
