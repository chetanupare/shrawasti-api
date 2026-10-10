const COUPONS: Record<string, {
  type: "flat" | "percent";
  value: number;
  maxDiscount?: number;
  minOrder: number;
  description: string;
}> = {
  SHRAWASTI100: {
    type: "flat",
    value: 100,
    minOrder: 499,
    description: "₹100 Flat Discount on orders above ₹499",
  },
  WELCOME50: {
    type: "flat",
    value: 50,
    minOrder: 249,
    description: "₹50 Flat Discount on welcome order",
  },
  FESTIVE20: {
    type: "percent",
    value: 20,
    maxDiscount: 200,
    minOrder: 399,
    description: "20% OFF up to ₹200 on orders above ₹399",
  },
  CLEAN20: {
    type: "percent",
    value: 20,
    maxDiscount: 150,
    minOrder: 299,
    description: "20% OFF up to ₹150 on orders above ₹299",
  },
};

export function quoteCoupon(code: unknown, subtotal: number) {
  const cleanCode = String(code || "").trim().toUpperCase();
  if (!cleanCode) {
    return { error: null as string | null, status: 200, code: "", discount: 0, description: "" };
  }

  const coupon = COUPONS[cleanCode];
  if (!coupon) {
    return { error: "Invalid coupon code. Try WELCOME50 or SHRAWASTI100", status: 404, code: cleanCode, discount: 0, description: "" };
  }

  const orderSubtotal = Number(subtotal) || 0;
  if (orderSubtotal < coupon.minOrder) {
    return {
      error: `Coupon requires a minimum order of ₹${coupon.minOrder}`,
      status: 422,
      code: cleanCode,
      discount: 0,
      description: coupon.description,
    };
  }

  let discount = coupon.type === "flat"
    ? coupon.value
    : Math.round((orderSubtotal * coupon.value) / 100);
  if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
  discount = Math.min(discount, orderSubtotal);

  return { error: null, status: 200, code: cleanCode, discount, description: coupon.description };
}
