import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdminUser } from "@/lib/auth";

const STEPS = ["booking_created", "booking_step_complete", "payment_started", "payment_succeeded", "payment_failed"];

export async function GET(request: Request) {
  try {
    const { error: authError, status, user } = await requireAdminUser(request);
    if (authError || !user) return NextResponse.json({ error: authError || "Authentication required" }, { status: status || 401 });

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabaseAdmin
      .from("analytics_events")
      .select("name, properties, created_at")
      .gte("created_at", since)
      .in("name", STEPS)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const counts: Record<string, number> = {};
    for (const name of STEPS) counts[name] = 0;
    const paymentSteps: Record<string, number> = {};

    for (const row of data || []) {
      counts[row.name] = (counts[row.name] || 0) + 1;
      const step = row.properties && typeof row.properties === "object" ? String((row.properties as { step?: string }).step || "") : "";
      if (row.name === "booking_step_complete" && step) {
        paymentSteps[step] = (paymentSteps[step] || 0) + 1;
      }
    }

    const started = counts.payment_started || 0;
    const paid = counts.payment_succeeded || 0;

    return NextResponse.json({
      windowDays: 30,
      counts,
      paymentSteps,
      conversion: started ? Math.round((paid / started) * 1000) / 10 : 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
