import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuthenticatedUser } from "@/lib/auth";

const ACTIVE = new Set(["accepted", "assigned", "arrived", "in_progress"]);

async function loadBooking(id: string) {
  const { data, error } = await supabaseAdmin.from("bookings").select("id, user_id, assigned_provider_id, status").eq("id", id).single();
  return { booking: data, error };
}

function canAccess(booking: { user_id: string; assigned_provider_id: string | null }, userId: string) {
  return booking.user_id === userId || booking.assigned_provider_id === userId;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authError, status, user } = await requireAuthenticatedUser(request);
    if (authError || !user) return NextResponse.json({ error: authError || "Authentication required" }, { status: status || 401 });

    const { id } = await params;
    const { booking, error } = await loadBooking(id);
    if (error || !booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (!canAccess(booking, user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data, error: readError } = await supabaseAdmin
      .from("booking_messages")
      .select("id, booking_id, sender_id, body, created_at")
      .eq("booking_id", id)
      .order("created_at", { ascending: true })
      .limit(200);

    if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });

    return NextResponse.json({
      messages: (data || []).map(row => ({
        id: row.id,
        bookingId: row.booking_id,
        senderId: row.sender_id,
        body: row.body,
        createdAt: row.created_at,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authError, status, user } = await requireAuthenticatedUser(request);
    if (authError || !user) return NextResponse.json({ error: authError || "Authentication required" }, { status: status || 401 });

    const { id } = await params;
    const { booking, error } = await loadBooking(id);
    if (error || !booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (!canAccess(booking, user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!ACTIVE.has(booking.status)) return NextResponse.json({ error: "Chat is open only during an active job" }, { status: 409 });

    const payload = await request.json().catch(() => ({}));
    const body = String(payload.body || "").trim();
    if (!body || body.length > 500) return NextResponse.json({ error: "Message must be 1 to 500 characters" }, { status: 400 });

    const { data, error: writeError } = await supabaseAdmin
      .from("booking_messages")
      .insert({ booking_id: id, sender_id: user.id, body })
      .select("id, booking_id, sender_id, body, created_at")
      .single();

    if (writeError || !data) return NextResponse.json({ error: writeError?.message || "Could not save message" }, { status: 500 });

    return NextResponse.json({
      message: {
        id: data.id,
        bookingId: data.booking_id,
        senderId: data.sender_id,
        body: data.body,
        createdAt: data.created_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
