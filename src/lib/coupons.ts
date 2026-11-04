import { supabaseAdmin } from "@/lib/supabase";

export type CouponQuote = {
  error: string | null;
  status: number;
  code: string;
  couponId: string | null;
  discount: number;
  description: string;
};

export async function quoteCoupon(code: unknown, subtotal: number): Promise<CouponQuote> {
  const cleanCode = String(code || "").trim().toUpperCase();
  if (!cleanCode) {
    return { error: null, status: 200, code: "", couponId: null, discount: 0, description: "" };
  }

  const { data: coupon, error } = await supabaseAdmin
    .from("coupons")
    .select("id, code, description, discount_type, discount_value, min_order_amount, max_discount_amount, max_redemptions, times_redeemed, is_active, expires_at")
    .eq("code", cleanCode)
    .maybeSingle();

  if (error) {
    return { error: "Could not check this coupon", status: 500, code: cleanCode, couponId: null, discount: 0, description: "" };
  }
  if (!coupon || coupon.is_active === false) {
    return { error: "Invalid coupon code", status: 404, code: cleanCode, couponId: null, discount: 0, description: "" };
  }
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    return { error: "This coupon has expired", status: 422, code: coupon.code, couponId: coupon.id, discount: 0, description: coupon.description || "" };
  }

  const redeemed = Number(coupon.times_redeemed) || 0;
  const maxRedemptions = coupon.max_redemptions == null ? null : Number(coupon.max_redemptions);
  if (maxRedemptions != null && redeemed >= maxRedemptions) {
    return { error: "This coupon has reached its redemption limit", status: 422, code: coupon.code, couponId: coupon.id, discount: 0, description: coupon.description || "" };
  }

  const orderSubtotal = Number(subtotal) || 0;
  const minOrder = Number(coupon.min_order_amount) || 0;
  if (orderSubtotal < minOrder) {
    return {
      error: `Coupon requires a minimum order of ₹${minOrder}`,
      status: 422,
      code: coupon.code,
      couponId: coupon.id,
      discount: 0,
      description: coupon.description || "",
    };
  }

  const value = Number(coupon.discount_value) || 0;
  const type = String(coupon.discount_type || "fixed").toLowerCase();
  let discount = type === "percentage" || type === "percent"
    ? Math.round((orderSubtotal * value) / 100)
    : Math.round(value);
  const maxDiscount = Number(coupon.max_discount_amount);
  if (Number.isFinite(maxDiscount) && maxDiscount > 0 && discount > maxDiscount) {
    discount = maxDiscount;
  }
  discount = Math.max(0, Math.min(discount, orderSubtotal));

  return {
    error: null,
    status: 200,
    code: coupon.code,
    couponId: coupon.id,
    discount,
    description: coupon.description || "",
  };
}

export async function redeemCoupon(couponId: string | null) {
  if (!couponId) return;
  const { data } = await supabaseAdmin
    .from("coupons")
    .select("times_redeemed, max_redemptions")
    .eq("id", couponId)
    .maybeSingle();
  if (!data) return;
  const redeemed = Number(data.times_redeemed) || 0;
  if (data.max_redemptions != null && redeemed >= Number(data.max_redemptions)) return;
  await supabaseAdmin.from("coupons").update({ times_redeemed: redeemed + 1 }).eq("id", couponId);
}
