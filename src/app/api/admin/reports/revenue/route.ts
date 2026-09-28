import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "30days"; // '7days', '30days', '90days'

    const { data: bookings, error } = await supabaseAdmin
      .from("bookings")
      .select("id, total, subtotal, discount, payment_method, status, created_at")
      .eq("status", "completed")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let totalRevenue = 0;
    let onlineRevenue = 0;
    let cashRevenue = 0;
    let totalDiscount = 0;

    const dailyBreakdown: Record<string, number> = {};

    (bookings || []).forEach((b: any) => {
      const amount = Number(b.total) || 0;
      const disc = Number(b.discount) || 0;
      const dateKey = new Date(b.created_at).toISOString().split("T")[0];

      totalRevenue += amount;
      totalDiscount += disc;

      if (b.payment_method === "online" || b.payment_method === "upi" || b.payment_method === "card") {
        onlineRevenue += amount;
      } else {
        cashRevenue += amount;
      }

      dailyBreakdown[dateKey] = (dailyBreakdown[dateKey] || 0) + amount;
    });

    return NextResponse.json({
      report: {
        timeframe,
        totalRevenue,
        onlineRevenue,
        cashRevenue,
        totalDiscount,
        totalCompletedBookings: (bookings || []).length,
        dailyBreakdown: Object.entries(dailyBreakdown).map(([date, revenue]) => ({ date, revenue })),
        currency: "INR",
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
