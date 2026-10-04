import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { calcTotals, getPriceFor, Service } from "@/lib/pricing";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    if (!userId) {
      return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
    }

    let query = supabase.from("bookings").select("*").eq("user_id", userId);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const bookings = (data || []).map((b) => ({
      id: b.id,
      userId: b.user_id,
      vehicleId: b.vehicle_id,
      assignedProviderId: b.assigned_provider_id,
      locationSnapshot: b.location_snapshot,
      vehicleSnapshot: b.vehicle_snapshot,
      services: b.services,
      scheduleDate: b.schedule_date,
      scheduleTime: b.schedule_time,
      paymentMethod: b.payment_method,
      paymentStatus: b.payment_status,
      subtotal: b.subtotal,
      discount: b.discount,
      total: b.total,
      status: b.status,
      idempotencyKey: b.idempotency_key,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }));

    return NextResponse.json({ bookings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authentication" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
    }
    
    const trueUserId = authData.user.id;
    const body = await request.json();
    const {
      vehicleId,
      locationSnapshot,
      vehicleSnapshot,
      services,
      scheduleDate,
      scheduleTime,
      paymentMethod,
      idempotencyKey,
    } = body;

    if (!locationSnapshot || !vehicleSnapshot || !services || !scheduleDate || !scheduleTime) {
      return NextResponse.json({ error: "Missing required booking details" }, { status: 400 });
    }
    
    // Check Idempotency
    if (idempotencyKey) {
      const { data: existing } = await supabaseAdmin
        .from("bookings")
        .select("*")
        .eq("idempotency_key", idempotencyKey)
        .eq("user_id", trueUserId)
        .maybeSingle();
        
      if (existing) {
        return NextResponse.json({ 
          booking: {
            id: existing.id,
            userId: existing.user_id,
            status: existing.status,
            total: existing.total
          }, 
          message: "Existing intent returned" 
        });
      }
    }

    // Authoritative Pricing Calculation
    const fullServices: Service[] = [];
    let discount = 0;
    
    for (const s of services) {
      const { data: svcData } = await supabaseAdmin
        .from("services")
        .select("*")
        .eq("id", s.serviceId || s.id)
        .single();
      
      if (svcData) {
        fullServices.push({
          id: svcData.id,
          name: svcData.name,
          basePrice: svcData.base_price,
          category: svcData.category,
          isActive: svcData.is_active,
          createdAt: svcData.created_at,
          updatedAt: svcData.updated_at,
          prices: svcData.prices
        });
      }
    }
    
    const bodyType = vehicleSnapshot?.bodyType || (vehicleSnapshot?.type === '2W' ? 'bike' : undefined);
    
    // Build authoritative snapshots
    const authoritativeServicesSnapshot = fullServices.map(s => ({
      serviceId: s.id,
      name: s.name,
      price: getPriceFor(s, bodyType) ?? s.basePrice ?? 0
    }));
    const { subtotal, total } = calcTotals(fullServices, bodyType);

    const isOnline = paymentMethod === "online" || paymentMethod === "card" || paymentMethod === "upi";
    const initialStatus = isOnline ? "pending" : "confirmed";
    const initialPaymentStatus = "pending";

    const newBooking = {
      user_id: trueUserId,
      vehicle_id: vehicleId || null,
      location_snapshot: locationSnapshot,
      vehicle_snapshot: vehicleSnapshot,
      services: authoritativeServicesSnapshot, // Authoritative structure
      schedule_date: scheduleDate,
      schedule_time: scheduleTime,
      payment_method: paymentMethod || "online",
      payment_status: initialPaymentStatus,
      subtotal: subtotal,
      discount: discount,
      total: total,
      status: initialStatus,
      idempotency_key: idempotencyKey || null,
    };

    const { data: savedBooking, error: insertError } = await supabaseAdmin
      .from("bookings")
      .insert(newBooking)
      .select()
      .single();

    if (insertError) {
      // If uniqueness violation on idempotency_key happens exactly here due to race
      if (insertError.code === '23505') {
         const { data: existing } = await supabaseAdmin.from("bookings").select("*").eq("idempotency_key", idempotencyKey).single();
         if (existing) {
           return NextResponse.json({ booking: { id: existing.id, status: existing.status } });
         }
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    if (initialStatus === "confirmed") {
      const { notifyBookingEvent } = require("@/lib/notifications");
      notifyBookingEvent(trueUserId, "BOOKING_CONFIRMED", savedBooking.id);
    }

    let razorpayOrder = null;
    if (isOnline && total > 0) {
      const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      
      if (keyId && keySecret) {
        const authBase64 = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
        const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Basic ${authBase64}` },
          body: JSON.stringify({
            amount: Math.round(total * 100),
            currency: "INR",
            receipt: savedBooking.id.substring(0, 40),
            notes: { bookingId: savedBooking.id }
          }),
        });
        
        if (orderRes.ok) {
          razorpayOrder = await orderRes.json();
          // Create payment record
          await supabaseAdmin.from("payments").insert({
            booking_id: savedBooking.id,
            user_id: trueUserId,
            razorpay_order_id: razorpayOrder.id,
            amount: total,
            method: paymentMethod || "online",
            status: "pending"
          });
        }
      }
    }

    return NextResponse.json(
      {
        booking: {
          id: savedBooking.id,
          userId: savedBooking.user_id,
          status: savedBooking.status,
          paymentStatus: savedBooking.payment_status,
          total: savedBooking.total
        },
        razorpayOrder: razorpayOrder ? {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          keyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
        } : null
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
