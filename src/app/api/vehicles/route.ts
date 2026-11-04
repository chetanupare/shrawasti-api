import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureUserExists, requireAuthenticatedUser } from "@/lib/auth";

function ownerIds(user: { id: string; raw_uid?: string }) {
  return [user.id, user.raw_uid].filter(Boolean);
}

function mapVehicle(v: any) {
  return {
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
  };
}

export async function GET(request: Request) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || "Authentication required" }, { status: authStatus || 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("vehicles")
      .select("*")
      .in("user_id", ownerIds(user))
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ vehicles: (data || []).map(mapVehicle) });
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
    const body = await request.json();
    const { type, bodyType, make, model, registrationNumber, nickname, color, isManual } = body;

    if (!type || !bodyType || !make || !model) {
      return NextResponse.json(
        { error: "Missing required fields: type, bodyType, make, model" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("vehicles")
      .insert({
        user_id: user.id,
        type,
        body_type: bodyType,
        make,
        model,
        registration_number: registrationNumber || null,
        nickname: nickname || null,
        color: color || null,
        is_manual: isManual ?? false,
      })
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Could not save vehicle" }, { status: 500 });
    }

    return NextResponse.json({ vehicle: mapVehicle(data) }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
