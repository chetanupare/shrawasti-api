import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isProviderAccountBlocked, requireAdminUser } from "@/lib/auth";
import { notifyBookingEvent } from "@/lib/notifications";

const BOOKING_STATUSES = new Set([
  "pending",
  "confirmed",
  "accepted",
  "assigned",
  "arrived",
  "in_progress",
  "completed",
  "cancelled",
]);

export async function GET(request: Request) {
  try {
    const { error: authError, status: authStatus } = await requireAdminUser(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "100"), 1), 200);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin.from("bookings").select("*", { count: "exact" });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = data || [];
    const userIds = [...new Set(rows.map((row: any) => row.user_id).filter(Boolean))];
    const providerIds = [...new Set(rows.map((row: any) => row.assigned_provider_id).filter(Boolean))];
    const [{ data: users }, { data: providers }] = await Promise.all([
      userIds.length
        ? supabaseAdmin.from("users").select("id, name, email, phone").in("id", userIds)
        : Promise.resolve({ data: [] }),
      providerIds.length
        ? supabaseAdmin.from("providers").select("id, name, phone").in("id", providerIds)
        : Promise.resolve({ data: [] }),
    ]);
    const userById = new Map((users || []).map((user: any) => [user.id, user]));
    const providerById = new Map((providers || []).map((provider: any) => [provider.id, provider]));

    const bookings = rows.map((b: any) => {
      const user = userById.get(b.user_id);
      const provider = providerById.get(b.assigned_provider_id);
      return {
        id: b.id,
        userId: b.user_id,
        user: user ? { name: user.name, phone: user.phone, email: user.email } : null,
        vehicleId: b.vehicle_id,
        assignedProviderId: b.assigned_provider_id,
        provider: provider ? { id: provider.id, name: provider.name, phone: provider.phone } : null,
        locationSnapshot: b.location_snapshot,
        vehicleSnapshot: b.vehicle_snapshot,
        services: b.services,
        scheduleDate: b.schedule_date,
        scheduleTime: b.schedule_time,
        paymentMethod: b.payment_method,
        paymentStatus: b.payment_status,
        subtotal: b.subtotal,
        discount: b.discount,
        total: b.total || b.total_amount,
        status: b.status,
        cancellationReason: b.cancellation_reason,
        cancelledAt: b.cancelled_at,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
      };
    });

    const totalCount = count ?? bookings.length;

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { error: authError, status: authStatus } = await requireAdminUser(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const body = await request.json();
    const { id, status, assignedProviderId, paymentStatus } = body;

    if (!id) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }
    if (status !== undefined && !BOOKING_STATUSES.has(status)) {
      return NextResponse.json({ error: "Unknown booking status" }, { status: 400 });
    }

    const { data: current, error: currentError } = await supabaseAdmin
      .from("bookings")
      .select("id, user_id, status, assigned_provider_id")
      .eq("id", id)
      .maybeSingle();

    if (currentError) return NextResponse.json({ error: currentError.message }, { status: 500 });
    if (!current) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    if (assignedProviderId) {
      const { data: provider, error: providerError } = await supabaseAdmin
        .from("providers")
        .select("id, status")
        .eq("id", assignedProviderId)
        .maybeSingle();
      if (providerError) return NextResponse.json({ error: providerError.message }, { status: 500 });
      if (!provider || isProviderAccountBlocked(provider.status)) {
        return NextResponse.json({ error: "Provider not found or inactive" }, { status: 422 });
      }
    }

    let nextStatus = status;
    if (assignedProviderId && (!nextStatus || nextStatus === "pending" || nextStatus === "confirmed")) {
      nextStatus = "accepted";
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (nextStatus !== undefined) updates.status = nextStatus;
    if (assignedProviderId !== undefined) updates.assigned_provider_id = assignedProviderId || null;
    if (paymentStatus !== undefined) updates.payment_status = paymentStatus;

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (assignedProviderId && assignedProviderId !== current.assigned_provider_id) {
      notifyBookingEvent(current.user_id, "TECHNICIAN_ASSIGNED", id);
      notifyBookingEvent(assignedProviderId, "NEW_JOB_ASSIGNED", id);
    }

    return NextResponse.json({ success: true, booking: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { error: authError, status: authStatus } = await requireAdminUser(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");
    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("bookings").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
