import { supabaseAdmin } from "@/lib/supabase";
import { normalizeBodyType } from "@/lib/pricing";

export type CarePassBilling = "weekly" | "monthly" | "annual";

const BILLING_PERIODS: CarePassBilling[] = ["weekly", "monthly", "annual"];

export function parseBillingPeriod(value: unknown): CarePassBilling | undefined {
  const billing = String(value || "").toLowerCase();
  return BILLING_PERIODS.find((period) => period === billing);
}

export function carePassAmount(
  prices: Record<string, unknown> | undefined,
  bodyType: string | undefined,
  billing: CarePassBilling,
  validityDays: number
): number | undefined {
  const key = normalizeBodyType(bodyType);
  if (!key || !prices) return undefined;
  const raw = prices[key];
  const base = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(base) || base <= 0) return undefined;

  if (billing === "weekly") {
    return validityDays === 7 ? Math.round(base) : Math.round(base / 4);
  }
  if (billing === "annual") {
    const monthly = validityDays === 7 ? base * 4 : base;
    return Math.round(monthly * 0.8);
  }
  return validityDays === 7 ? Math.round(base * 4) : Math.round(base);
}

export function carePassPeriodEnd(start: Date, billing: CarePassBilling, validityDays: number): Date {
  const end = new Date(start);
  if (billing === "weekly") {
    end.setDate(end.getDate() + 7);
    return end;
  }
  if (billing === "annual") {
    end.setDate(end.getDate() + 365);
    return end;
  }
  end.setDate(end.getDate() + (validityDays > 0 ? validityDays : 30));
  return end;
}

export function washesIncluded(billing: CarePassBilling): number {
  if (billing === "weekly") return 1;
  if (billing === "annual") return 48;
  return 4;
}

export async function markCarePassPaid(input: {
  orderId: string;
  paymentId: string;
  signature?: string;
  amountPaid?: number;
  userIds?: string[];
}) {
  const { data: payment, error } = await supabaseAdmin
    .from("subscription_payments")
    .select("id, subscription_id, amount, status, user_subscriptions(id, user_id, status)")
    .eq("gateway_order_id", input.orderId)
    .maybeSingle();

  if (error || !payment) {
    return { error: "Care Pass payment was not found for this order", status: 404 as const };
  }

  const subscription = Array.isArray(payment.user_subscriptions)
    ? payment.user_subscriptions[0]
    : payment.user_subscriptions;

  if (!subscription) {
    return { error: "Care Pass subscription was not found", status: 404 as const };
  }

  if (input.userIds && input.userIds.length > 0 && !input.userIds.includes(subscription.user_id)) {
    return { error: "This payment does not belong to the signed-in customer", status: 403 as const };
  }

  if (payment.status === "succeeded" || subscription.status === "active") {
    return { error: null, status: 200 as const, subscriptionId: subscription.id, alreadyActive: true };
  }

  if (input.amountPaid !== undefined && Math.round(Number(payment.amount)) !== Math.round(input.amountPaid)) {
    await supabaseAdmin.from("subscription_payments").update({
      status: "failed",
      updated_at: new Date().toISOString(),
    }).eq("id", payment.id);
    await supabaseAdmin.from("user_subscriptions").update({
      status: "payment_failed",
      updated_at: new Date().toISOString(),
    }).eq("id", subscription.id);
    return { error: "Paid amount does not match the Care Pass price", status: 400 as const };
  }

  const now = new Date().toISOString();
  const { error: paymentError } = await supabaseAdmin
    .from("subscription_payments")
    .update({
      status: "succeeded",
      gateway: "razorpay",
      gateway_payment_id: input.paymentId,
      gateway_signature: input.signature || null,
      updated_at: now,
    })
    .eq("id", payment.id);

  if (paymentError) {
    return { error: paymentError.message, status: 500 as const };
  }

  const { error: subError } = await supabaseAdmin
    .from("user_subscriptions")
    .update({ status: "active", updated_at: now })
    .eq("id", subscription.id)
    .in("status", ["pending", "payment_failed"]);

  if (subError) {
    return { error: subError.message, status: 500 as const };
  }

  return { error: null, status: 200 as const, subscriptionId: subscription.id, alreadyActive: false };
}
