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

    const { id: bookingId } = await params;

    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select(`
        *,
        users ( name, email, phone )
      `)
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check ownership or admin access
    const isOwner = booking.user_id === user.id || (user.raw_uid && booking.user_id === user.raw_uid);
    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden: Cannot access invoice of another user" }, { status: 403 });
    }

    const invoiceNumber = `INV-${booking.id.substring(0, 8).toUpperCase()}`;
    const invoiceDate = booking.updated_at || booking.created_at;
    const customerInfo = Array.isArray(booking.users) ? booking.users[0] : booking.users;

    const subtotal = Number(booking.subtotal) || 0;
    const discount = Number(booking.discount) || 0;
    const total = Number(booking.total) || 0;
    const gstRate = 0.18;
    const netAmount = Math.round(total / (1 + gstRate));
    const gstAmount = total - netAmount;

    return NextResponse.json({
      invoice: {
        invoiceNumber,
        invoiceDate,
        company: {
          name: "Shrawasti Car Care Pvt Ltd",
          gstin: "27AAACS1234F1Z9",
          address: "Doorstep Precision Care Network, India",
          contact: "support@shrawasticarcare.com",
        },
        customer: {
          name: customerInfo?.name || "Customer",
          email: customerInfo?.email || "—",
          phone: customerInfo?.phone || "—",
          address: booking.location_snapshot?.address || "—",
        },
        vehicle: booking.vehicle_snapshot,
        services: booking.services || [],
        paymentMethod: booking.payment_method,
        paymentStatus: booking.payment_status,
        financials: {
          grossTotal: subtotal,
          discount,
          netBeforeTax: netAmount,
          cgst: Math.round(gstAmount / 2),
          sgst: Math.round(gstAmount / 2),
          totalGst: gstAmount,
          finalAmountPaid: total,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
