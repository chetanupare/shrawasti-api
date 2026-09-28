import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("*, subscription_plans(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const subscriptions = (data || []).map((sub: any) => ({
      id: sub.id,
      userId: sub.user_id,
      planId: sub.plan_id,
      status: sub.status,
      startDate: sub.start_date,
      endDate: sub.end_date,
      washesRemaining: sub.washes_remaining,
      plan: sub.subscription_plans
        ? {
            id: sub.subscription_plans.id,
            name: sub.subscription_plans.name,
            description: sub.subscription_plans.description,
            benefits: sub.subscription_plans.benefits,
            validityDays: sub.subscription_plans.validity_days,
            prices: sub.subscription_plans.prices,
          }
        : null,
      createdAt: sub.created_at,
      updatedAt: sub.updated_at,
    }));

    return NextResponse.json({ subscriptions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, planId, startDate, endDate, washesRemaining } = body;

    if (!userId || !planId) {
      return NextResponse.json({ error: "userId and planId are required" }, { status: 400 });
    }

    const newSubscription = {
      user_id: userId,
      plan_id: planId,
      status: "active",
      start_date: startDate || new Date().toISOString(),
      end_date: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      washes_remaining: washesRemaining ?? 4,
    };

    const { data, error } = await supabase
      .from("user_subscriptions")
      .insert(newSubscription)
      .select("*, subscription_plans(*)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        subscription: {
          id: data.id,
          userId: data.user_id,
          planId: data.plan_id,
          status: data.status,
          startDate: data.start_date,
          endDate: data.end_date,
          washesRemaining: data.washes_remaining,
          plan: data.subscription_plans,
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
