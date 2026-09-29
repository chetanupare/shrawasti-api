import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId");

    if (!providerId) {
      return NextResponse.json({ error: "providerId parameter is required" }, { status: 400 });
    }

    const { data: completedBookings, error } = await supabase
      .from("bookings")
      .select("id, total, created_at, updated_at")
      .eq("assigned_provider_id", providerId)
      .eq("status", "completed");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).getTime();

    let totalEarnings = 0;
    let todayEarnings = 0;
    let weekEarnings = 0;
    let todayJobsCount = 0;

    (completedBookings || []).forEach((b: any) => {
      const amount = Number(b.total) || 0;
      const jobTime = new Date(b.updated_at || b.created_at).getTime();

      totalEarnings += amount;

      if (jobTime >= startOfToday) {
        todayEarnings += amount;
        todayJobsCount += 1;
      }
      if (jobTime >= startOfWeek) {
        weekEarnings += amount;
      }
    });

    // Payout split (80% provider payout rate)
    const providerShareRate = 0.8;

    return NextResponse.json({
      earnings: {
        totalEarnings: Math.round(totalEarnings * providerShareRate),
        todayEarnings: Math.round(todayEarnings * providerShareRate),
        weekEarnings: Math.round(weekEarnings * providerShareRate),
        totalCompletedJobs: (completedBookings || []).length,
        todayJobsCount,
        payoutRate: "80%",
        currency: "INR",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
