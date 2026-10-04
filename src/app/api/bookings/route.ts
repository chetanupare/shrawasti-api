import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { calcTotals, getPriceFor, Service } from "@/lib/pricing";
import { requireAuthenticatedUser, ensureUserExists } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    if (!userId) {
      return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
    }

    const { getFirebaseUuid } = require("@/lib/auth");
    const uuid = getFirebaseUuid(userId) || userId;

    let query = supabase
      .from("bookings")
      .select("*")
      .or(`user_id.eq.${userId},user_id.eq.${uuid}`);

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
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || "Authentication required" }, { status: authStatus || 401 });
    }

    await ensureUserExists(user);
    const trueUserId = user.id;
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
    const { subtotal, total: grossTotal } = calcTotals(fullServices, bodyType);
    discount = Math.min(grossTotal, Math.max(0, Number(body.discount) || 0));
    const total = Math.max(0, grossTotal - discount);

    const isOnline = paymentMethod === "online" || paymentMethod === "card" || paymentMethod === "upi";
    const initialStatus = isOnline ? "pending" : "confirmed";
    const initialPaymentStatus = "pending";

    // Ensure vehicle is present in user's garage (vehicles table)
    let finalVehicleId = vehicleId || null;

    if (trueUserId && vehicleSnapshot) {
      const vMake = vehicleSnapshot.make || vehicleSnapshot.brand || "";
      const vModel = vehicleSnapshot.model || "";
      const vType = vehicleSnapshot.type || "4W";
      const vBodyType = vehicleSnapshot.bodyType || vehicleSnapshot.body_type || (vType === "2W" || vType === "Bike" ? "bike" : "hatchback");
      const vReg = vehicleSnapshot.registrationNumber || vehicleSnapshot.registration_number || null;
      const vColor = vehicleSnapshot.color || null;

      let existingVehicle = null;

      if (finalVehicleId) {
        const { data: vRow } = await supabaseAdmin
          .from("vehicles")
          .select("*")
          .eq("id", finalVehicleId)
          .maybeSingle();
        if (vRow) {
          existingVehicle = vRow;
        }
      }

      if (!existingVehicle && (vMake || vModel)) {
        let matchQuery = supabaseAdmin
          .from("vehicles")
          .select("*")
          .eq("user_id", trueUserId);

        if (vMake) matchQuery = matchQuery.ilike("make", vMake);
        if (vModel) matchQuery = matchQuery.ilike("model", vModel);

        const { data: matches } = await matchQuery;
        if (matches && matches.length > 0) {
          if (vReg) {
            existingVehicle = matches.find((m) => m.registration_number === vReg) || matches[0];
          } else {
            existingVehicle = matches[0];
          }
        }
      }

      if (existingVehicle) {
        finalVehicleId = existingVehicle.id;
      } else if (vMake || vModel) {
        const { data: newV, error: newVErr } = await supabaseAdmin
          .from("vehicles")
          .insert({
            user_id: trueUserId,
            type: vType,
            body_type: vBodyType,
            make: vMake || "Vehicle",
            model: vModel || "Model",
            registration_number: vReg,
            color: vColor,
            is_manual: false,
          })
          .select()
          .single();

        if (newV && !newVErr) {
          finalVehicleId = newV.id;
        }
      }
    }

    const newBooking = {
      user_id: trueUserId,
      vehicle_id: finalVehicleId,
      location_snapshot: locationSnapshot,
      vehicle_snapshot: vehicleSnapshot,
      services: authoritativeServicesSnapshot,
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
