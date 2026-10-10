import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireAuthenticatedUser } from "@/lib/auth";
import { markCarePassPaid } from "@/lib/carePass";

export async function POST(request: Request) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || "Authentication required" }, { status: authStatus || 401 });
    }

    const body = await request.json();
    const { subscriptionId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!subscriptionId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Missing Care Pass payment details" }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: "Razorpay key secret not configured on server" }, { status: 500 });
    }

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const result = await markCarePassPaid({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
      userIds: [user.id, user.raw_uid].filter(Boolean),
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if (result.subscriptionId !== subscriptionId) {
      return NextResponse.json({ error: "Payment does not match this Care Pass" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      subscriptionId: result.subscriptionId,
      alreadyActive: result.alreadyActive,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
