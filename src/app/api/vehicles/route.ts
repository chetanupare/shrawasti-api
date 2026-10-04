import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getFirebaseUuid } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
    }

    const uuid = getFirebaseUuid(userId) || userId;

    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .or(`user_id.eq.${userId},user_id.eq.${uuid}`)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const vehicles = (data || []).map((v) => ({
      id: v.id,
      userId: v.user_id,
      type: v.type,
      bodyType: v.body_type,
      make: v.make,
      model: v.model,
      registrationNumber: v.registration_number,
      nickname: v.nickname,
      color: v.color,
      isManual: v.is_manual,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
    }));

    return NextResponse.json({ vehicles });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, type, bodyType, make, model, registrationNumber, nickname, color, isManual } = body;

    if (!userId || !type || !bodyType || !make || !model) {
      return NextResponse.json(
        { error: "Missing required fields: userId, type, bodyType, make, model" },
        { status: 400 }
      );
    }

    const newVehicle = {
      user_id: userId,
      type,
      body_type: bodyType,
      make,
      model,
      registration_number: registrationNumber || null,
      nickname: nickname || null,
      color: color || null,
      is_manual: isManual ?? false,
    };

    const { data, error } = await supabase
      .from("vehicles")
      .insert(newVehicle)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        vehicle: {
          id: data.id,
          userId: data.user_id,
          type: data.type,
          bodyType: data.body_type,
          make: data.make,
          model: data.model,
          registrationNumber: data.registration_number,
          nickname: data.nickname,
          color: data.color,
          isManual: data.is_manual,
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
