import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    // 1. Total users count
    const { count: totalUsers } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true });

    // 2. Total bookings & status counts
    const { data: bookings } = await supabaseAdmin
      .from("bookings")
      .select("id, status, total, created_at");

    let totalRevenue = 0;
    let pendingBookings = 0;
    let inProgressBookings = 0;
    let completedBookings = 0;
    let cancelledBookings = 0;
    let todayBookingsCount = 0;
    let todayRevenue = 0;

    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0)).getTime();

    (bookings || []).forEach((b: any) => {
      const amount = Number(b.total) || 0;
      const createdTime = new Date(b.created_at).getTime();

      if (b.status === "completed") {
        totalRevenue += amount;
        completedBookings += 1;
      } else if (b.status === "pending") {
        pendingBookings += 1;
      } else if (b.status === "in_progress" || b.status === "accepted" || b.status === "en_route") {
        inProgressBookings += 1;
      } else if (b.status === "cancelled") {
        cancelledBookings += 1;
      }

      if (createdTime >= startOfToday) {
        todayBookingsCount += 1;
        if (b.status === "completed") todayRevenue += amount;
      }
    });

    // 3. Active providers count
    const { count: activeProviders } = await supabaseAdmin
      .from("providers")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers || 0,
        totalBookings: (bookings || []).length,
        totalRevenue,
        todayRevenue,
        todayBookingsCount,
        pendingBookings,
        inProgressBookings,
        completedBookings,
        cancelledBookings,
        activeProviders: activeProviders || 0,
        currency: "INR",
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
