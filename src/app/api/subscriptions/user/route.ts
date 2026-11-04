import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuthenticatedUser } from "@/lib/auth";

const MAX_PAUSE_DAYS = 14;

function ownerIds(user: { id: string; raw_uid?: string }) {
  return [user.id, user.raw_uid].filter(Boolean);
}

function owns(user: { id: string; raw_uid?: string }, ownerId: string | null | undefined) {
  return !!ownerId && (ownerId === user.id || ownerId === user.raw_uid);
}

function mapSubscription(sub: any) {
  return {
    id: sub.id,
    userId: sub.user_id,
    vehicleId: sub.vehicle_id || null,
    planId: sub.plan_id,
    status: sub.status,
    billingPeriod: sub.billing_period || "monthly",
    startDate: sub.start_date || sub.current_period_start,
    endDate: sub.end_date || sub.current_period_end,
    washesRemaining: sub.washes_remaining ?? (sub.subscription_entitlements?.[0]
      ? sub.subscription_entitlements[0].included_quantity - sub.subscription_entitlements[0].used_quantity
      : 0),
    snapshotPrice: Number(sub.snapshot_price || 0),
    snapshotPlanName: sub.snapshot_plan_name || sub.subscription_plans?.name || "Care Pass",
    snapshotVehicleType: sub.snapshot_vehicle_type || "4W",
    pausedAt: sub.paused_at || null,
    pauseUntil: sub.pause_until || null,
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
  };
}

export async function GET(request: Request) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || "Authentication required" }, { status: authStatus || 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("user_subscriptions")
      .select("*, subscription_plans(*), subscription_entitlements(*)")
      .in("user_id", ownerIds(user))
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ subscriptions: (data || []).map(mapSubscription) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json(
    { error: "Care Pass starts after Razorpay payment is verified." },
    { status: 405 }
  );
}

export async function PUT(request: Request) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || "Authentication required" }, { status: authStatus || 401 });
    }

    const body = await request.json();
    const subId = body.subscriptionId || body.id;
    const status = body.status;

    if (!subId || (status !== "paused" && status !== "active")) {
      return NextResponse.json({ error: "subscriptionId and status paused or active are required" }, { status: 400 });
    }

    const { data: current, error: lookupError } = await supabaseAdmin
      .from("user_subscriptions")
      .select("*, subscription_plans(*)")
      .eq("id", subId)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }
    if (!current || !owns(user, current.user_id)) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const updates: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "paused") {
      if (current.status !== "active") {
        return NextResponse.json({ error: "Only an active Care Pass can be paused" }, { status: 422 });
      }
      const pauseDays = Number(body.pauseDays);
      if (!Number.isInteger(pauseDays) || pauseDays < 1 || pauseDays > MAX_PAUSE_DAYS) {
        return NextResponse.json({ error: `Pause must be between 1 and ${MAX_PAUSE_DAYS} days` }, { status: 400 });
      }
      const now = new Date();
      const until = new Date(now.getTime() + pauseDays * 24 * 60 * 60 * 1000);
      const end = new Date(current.current_period_end || current.end_date);
      if (Number.isFinite(end.getTime())) {
        end.setTime(end.getTime() + pauseDays * 24 * 60 * 60 * 1000);
        updates.current_period_end = end.toISOString();
        updates.end_date = end.toISOString();
      }
      updates.paused_at = now.toISOString();
      updates.pause_until = until.toISOString();
    } else if (current.status !== "paused") {
      return NextResponse.json({ error: "Only a paused Care Pass can be resumed" }, { status: 422 });
    } else {
      updates.paused_at = null;
      updates.pause_until = null;
    }

    const { data, error } = await supabaseAdmin
      .from("user_subscriptions")
      .update(updates)
      .eq("id", subId)
      .eq("user_id", current.user_id)
      .select("*, subscription_plans(*), subscription_entitlements(*)")
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Could not update Care Pass" }, { status: 500 });
    }

    return NextResponse.json({ subscription: mapSubscription(data) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
