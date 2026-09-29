import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const [plansRes, userSubsRes] = await Promise.all([
      supabaseAdmin.from("subscription_plans").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("user_subscriptions").select("*").order("created_at", { ascending: false }),
    ]);

    if (plansRes.error) {
      return NextResponse.json({ error: plansRes.error.message }, { status: 500 });
    }

    const plans = (plansRes.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description || "",
      benefits: Array.isArray(p.benefits) ? p.benefits : (typeof p.benefits === "string" ? JSON.parse(p.benefits) : []),
      validityDays: p.validity_days || p.validityDays || 30,
      popular: p.popular ?? false,
      basePrice: Number(p.base_price || p.basePrice || 999),
      isActive: p.is_active ?? true,
      prices: p.prices || {},
    }));

    const userSubscriptions = (userSubsRes.data || []).map((us: any) => ({
      id: us.id,
      userId: us.user_id || us.userId,
      planId: us.plan_id || us.planId,
      status: us.status || "active",
      billingPeriod: us.billing_period || "monthly",
      currentPeriodStart: us.current_period_start,
      currentPeriodEnd: us.current_period_end,
      snapshotPrice: Number(us.snapshot_price || 0),
      snapshotPlanName: us.snapshot_plan_name || "CarePass Plan",
      createdAt: us.created_at,
    }));

    return NextResponse.json({ plans, userSubscriptions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, benefits, validityDays, popular, basePrice, isActive, prices } = body;

    if (!name) {
      return NextResponse.json({ error: "Plan name is required" }, { status: 400 });
    }

    const newPlan = {
      name,
      description: description || "",
      benefits: Array.isArray(benefits) ? benefits : [benefits || "Full Access"],
      validity_days: validityDays ? parseInt(validityDays) : 30,
      popular: popular ?? false,
      base_price: basePrice ? parseFloat(basePrice) : 999,
      is_active: isActive ?? true,
      prices: prices || {},
    };

    const { data, error } = await supabaseAdmin
      .from("subscription_plans")
      .insert(newPlan)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ plan: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, benefits, validityDays, popular, basePrice, isActive, prices, userSubscriptionId, status } = body;

    if (userSubscriptionId) {
      // Updating user subscription status (e.g. pause, cancel, activate)
      const { data, error } = await supabaseAdmin
        .from("user_subscriptions")
        .update({ status })
        .eq("id", userSubscriptionId)
        .select()
        .maybeSingle();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, userSubscription: data });
    }

    if (!id) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (benefits !== undefined) updates.benefits = Array.isArray(benefits) ? benefits : [benefits];
    if (validityDays !== undefined) updates.validity_days = parseInt(validityDays);
    if (popular !== undefined) updates.popular = popular;
    if (basePrice !== undefined) updates.base_price = parseFloat(basePrice);
    if (isActive !== undefined) updates.is_active = isActive;
    if (prices !== undefined) updates.prices = prices;

    const { data, error } = await supabaseAdmin
      .from("subscription_plans")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, plan: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");
    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("subscription_plans").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
