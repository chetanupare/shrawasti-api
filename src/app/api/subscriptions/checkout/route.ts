import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureUserExists, requireAuthenticatedUser } from "@/lib/auth";
import {
  carePassAmount,
  carePassPeriodEnd,
  parseBillingPeriod,
  washesIncluded,
} from "@/lib/carePass";

export async function POST(request: Request) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || "Authentication required" }, { status: authStatus || 401 });
    }

    await ensureUserExists(user);
    const body = await request.json();
    const billing = parseBillingPeriod(body.billingPeriod);
    const planId = body.planId as string | undefined;
    const bodyType = body.bodyType as string | undefined;

    if (!planId || !billing || !bodyType) {
      return NextResponse.json(
        { error: "planId, bodyType, and billingPeriod are required" },
        { status: 400 }
      );
    }

    const { data: plan, error: planError } = await supabaseAdmin
      .from("subscription_plans")
      .select("id, name, validity_days, prices, is_active")
      .eq("id", planId)
      .maybeSingle();

    if (planError || !plan || plan.is_active === false) {
      return NextResponse.json({ error: "Care Pass plan was not found" }, { status: 404 });
    }

    const prices = typeof plan.prices === "string" ? JSON.parse(plan.prices) : plan.prices;
    const validityDays = Number(plan.validity_days) || 30;
    const amount = carePassAmount(prices, bodyType, billing, validityDays);
    if (!amount) {
      return NextResponse.json(
        { error: "This plan has no price for the selected body type" },
        { status: 422 }
      );
    }

    const userIds = [user.id, user.raw_uid].filter(Boolean);
    const { data: vehicles } = await supabaseAdmin
      .from("vehicles")
      .select("id, body_type, user_id, created_at")
      .in("user_id", userIds)
      .order("created_at", { ascending: false });

    const vehicle = (vehicles || [])[0];
    if (!vehicle) {
      return NextResponse.json(
        { error: "Add a vehicle in your garage before buying a Care Pass" },
        { status: 422 }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from("user_subscriptions")
      .select("id, status")
      .eq("vehicle_id", vehicle.id)
      .in("status", ["pending", "active", "paused"])
      .maybeSingle();

    if (existing && (existing.status === "active" || existing.status === "paused")) {
      return NextResponse.json(
        { error: "This vehicle already has a Care Pass" },
        { status: 409 }
      );
    }

    const start = new Date();
    const end = carePassPeriodEnd(start, billing, validityDays);
    const subscriptionRow = {
      user_id: user.id,
      vehicle_id: vehicle.id,
      plan_id: plan.id,
      status: "pending",
      billing_period: billing,
      current_period_start: start.toISOString(),
      current_period_end: end.toISOString(),
      snapshot_price: amount,
      snapshot_vehicle_type: bodyType,
      snapshot_plan_name: plan.name,
      updated_at: start.toISOString(),
    };

    let subscriptionId = existing?.id as string | undefined;
    if (subscriptionId) {
      const { error: updateError } = await supabaseAdmin
        .from("user_subscriptions")
        .update(subscriptionRow)
        .eq("id", subscriptionId);
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    } else {
      const { data: created, error: insertError } = await supabaseAdmin
        .from("user_subscriptions")
        .insert(subscriptionRow)
        .select("id")
        .single();
      if (insertError || !created) {
        return NextResponse.json({ error: insertError?.message || "Could not start Care Pass" }, { status: 500 });
      }
      subscriptionId = created.id;
    }

    const { data: existingEntitlement } = await supabaseAdmin
      .from("subscription_entitlements")
      .select("id")
      .eq("subscription_id", subscriptionId)
      .eq("entitlement_type", "wash")
      .maybeSingle();

    if (existingEntitlement) {
      await supabaseAdmin
        .from("subscription_entitlements")
        .update({
          included_quantity: washesIncluded(billing),
          updated_at: start.toISOString(),
        })
        .eq("id", existingEntitlement.id);
    } else {
      await supabaseAdmin.from("subscription_entitlements").insert({
        subscription_id: subscriptionId,
        entitlement_type: "wash",
        included_quantity: washesIncluded(billing),
      });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Razorpay is not configured" }, { status: 500 });
    }

    const authBase64 = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${authBase64}` },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: String(subscriptionId).substring(0, 40),
        notes: { subscriptionId, planId: plan.id, billing },
      }),
    });

    if (!orderRes.ok) {
      const detail = await orderRes.text();
      return NextResponse.json({ error: detail || "Could not create Razorpay order" }, { status: 502 });
    }

    const razorpayOrder = await orderRes.json();
    const { error: paymentError } = await supabaseAdmin.from("subscription_payments").insert({
      subscription_id: subscriptionId,
      amount,
      currency: "INR",
      status: "pending",
      gateway: "razorpay",
      gateway_order_id: razorpayOrder.id,
    });

    if (paymentError) {
      return NextResponse.json({ error: paymentError.message }, { status: 500 });
    }

    return NextResponse.json({
      subscriptionId,
      amount,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
