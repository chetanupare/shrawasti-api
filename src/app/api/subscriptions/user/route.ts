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
      .select("*, subscription_plans(*), subscription_entitlements(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const subscriptions = (data || []).map((sub: any) => ({
      id: sub.id,
      userId: sub.user_id,
      vehicleId: sub.vehicle_id || null,
      planId: sub.plan_id,
      status: sub.status,
      startDate: sub.start_date || sub.current_period_start,
      endDate: sub.end_date || sub.current_period_end,
      washesRemaining: sub.washes_remaining ?? (sub.subscription_entitlements?.[0] ? sub.subscription_entitlements[0].included_quantity - sub.subscription_entitlements[0].used_quantity : 0),
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
      entitlements: (sub.subscription_entitlements || []).map((e: any) => ({
        id: e.id,
        entitlementType: e.entitlement_type,
        includedQuantity: e.included_quantity,
        reservedQuantity: e.reserved_quantity,
        usedQuantity: e.used_quantity,
      })),
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
    const { userId, vehicleId, planId, startDate, endDate, washesRemaining, snapshotPrice, snapshotVehicleType, snapshotPlanName } = body;

    if (!userId || !planId) {
      return NextResponse.json({ error: "userId and planId are required" }, { status: 400 });
    }

    const now = new Date();
    const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const newSubscription = {
      user_id: userId,
      vehicle_id: vehicleId || null,
      plan_id: planId,
      status: "active",
      start_date: startDate || now.toISOString(),
      end_date: endDate || end.toISOString(),
      current_period_start: startDate || now.toISOString(),
      current_period_end: endDate || end.toISOString(),
      billing_period: "monthly",
      washes_remaining: washesRemaining ?? 4,
      snapshot_price: snapshotPrice || 0,
      snapshot_vehicle_type: snapshotVehicleType || "4W",
      snapshot_plan_name: snapshotPlanName || "Care Pass",
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
          vehicleId: data.vehicle_id,
          planId: data.plan_id,
          status: data.status,
          startDate: data.start_date || data.current_period_start,
          endDate: data.end_date || data.current_period_end,
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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { subscriptionId, id, status, pauseDays } = body;
    const subId = subscriptionId || id;

    if (!subId || !status) {
      return NextResponse.json({ error: "subscriptionId and status are required" }, { status: 400 });
    }

    const updates: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'paused' && pauseDays) {
      const now = new Date();
      const until = new Date(now.getTime() + pauseDays * 24 * 60 * 60 * 1000);
      updates.paused_at = now.toISOString();
      updates.pause_until = until.toISOString();
    } else if (status === 'active') {
      updates.paused_at = null;
      updates.pause_until = null;
    }

    const { data, error } = await supabase
      .from("user_subscriptions")
      .update(updates)
      .eq("id", subId)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ subscription: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
