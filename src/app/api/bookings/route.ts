import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    if (!userId) {
      return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
    }

    let query = supabase.from("bookings").select("*").eq("user_id", userId);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const bookings = (data || []).map((b) => ({
      id: b.id,
      userId: b.user_id,
      vehicleId: b.vehicle_id,
      assignedProviderId: b.assigned_provider_id,
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
      idempotencyKey: b.idempotency_key,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }));

    return NextResponse.json({ bookings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      vehicleId,
      locationSnapshot,
      vehicleSnapshot,
      services,
      scheduleDate,
      scheduleTime,
      paymentMethod,
      subtotal,
      discount,
      total,
      idempotencyKey,
    } = body;

    if (!userId || !locationSnapshot || !vehicleSnapshot || !services || !scheduleDate || !scheduleTime || total === undefined) {
      return NextResponse.json(
        { error: "Missing required booking details" },
        { status: 400 }
      );
    }

    const headerIdempotencyKey = request.headers.get("x-idempotency-key");
    const keyToUse = idempotencyKey || headerIdempotencyKey || null;

    if (keyToUse) {
      const { data: existingBooking } = await supabase
        .from("bookings")
        .select("*")
        .eq("idempotency_key", keyToUse)
        .maybeSingle();

      if (existingBooking) {
        return NextResponse.json(
          {
            booking: {
              id: existingBooking.id,
              userId: existingBooking.user_id,
              vehicleId: existingBooking.vehicle_id,
              locationSnapshot: existingBooking.location_snapshot,
              vehicleSnapshot: existingBooking.vehicle_snapshot,
              services: existingBooking.services,
              scheduleDate: existingBooking.schedule_date,
              scheduleTime: existingBooking.schedule_time,
              paymentMethod: existingBooking.payment_method,
              paymentStatus: existingBooking.payment_status,
              subtotal: existingBooking.subtotal,
              discount: existingBooking.discount,
              total: existingBooking.total,
              status: existingBooking.status,
              idempotencyKey: existingBooking.idempotency_key,
              createdAt: existingBooking.created_at,
              updatedAt: existingBooking.updated_at,
            },
            isDuplicate: true,
          },
          { status: 200 }
        );
      }
    }

    const newBooking = {
      user_id: userId,
      vehicle_id: vehicleId || null,
      location_snapshot: locationSnapshot,
      vehicle_snapshot: vehicleSnapshot,
      services: services,
      schedule_date: scheduleDate,
      schedule_time: scheduleTime,
      payment_method: paymentMethod || "online",
      payment_status: paymentMethod === "cash" || paymentMethod === "after_service" ? "pending" : "pending",
      subtotal: subtotal || total,
      discount: discount || 0,
      total: total,
      status: "pending",
      idempotency_key: keyToUse,
    };

    const { data, error } = await supabase
      .from("bookings")
      .insert(newBooking)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        booking: {
          id: data.id,
          userId: data.user_id,
          vehicleId: data.vehicle_id,
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
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
