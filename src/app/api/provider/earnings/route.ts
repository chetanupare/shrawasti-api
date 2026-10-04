import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { requireProviderUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { error: authError, status: authStatus, user, provider } = await requireProviderUser(request);
    if (authError || !provider) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId");

    if (providerId && providerId !== provider.id && providerId !== user.id && (user as any).raw_uid && providerId !== (user as any).raw_uid) {
      return NextResponse.json({ error: "Forbidden: Cannot access earnings of another provider" }, { status: 403 });
    }

    const { data: completedBookings, error } = await supabaseAdmin
      .from("bookings")
      .select("id, total, created_at, updated_at")
      .eq("assigned_provider_id", provider.id)
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
    const finalTotal = Math.round(totalEarnings * providerShareRate);
    const finalToday = Math.round(todayEarnings * providerShareRate);
    const finalWeek = Math.round(weekEarnings * providerShareRate);

    return NextResponse.json({
      today: finalToday,
      thisWeek: finalWeek,
      thisMonth: finalTotal,
      total: finalTotal,
      completedJobsCount: (completedBookings || []).length,
      todayJobsCount,
      earnings: {
        total: finalTotal,
        today: finalToday,
        thisWeek: finalWeek,
        totalEarnings: finalTotal,
        todayEarnings: finalToday,
        weekEarnings: finalWeek,
        totalCompletedJobs: (completedBookings || []).length,
        completedJobsCount: (completedBookings || []).length,
        todayJobsCount,
        payoutRate: "80%",
        currency: "INR",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
