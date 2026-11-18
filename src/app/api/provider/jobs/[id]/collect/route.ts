import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireProviderUser } from "@/lib/auth";
import { collectionQrForBooking } from "@/lib/razorpayQr";

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
    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select("id, user_id, total, payment_status, payment_method, status, assigned_provider_id")
      .eq("id", bookingId)
      .maybeSingle();

    if (error || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.assigned_provider_id !== provider.id) {
      return NextResponse.json({ error: "This job is not assigned to you" }, { status: 403 });
    }

    const qr = await collectionQrForBooking(booking);
    if (qr.error) return NextResponse.json({ error: qr.error }, { status: 502 });
    return NextResponse.json({
      paid: qr.paid,
      imageUrl: qr.imageUrl,
      amount: qr.amount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
