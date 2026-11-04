import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuthenticatedUser } from "@/lib/auth";

function owns(user: { id: string; raw_uid?: string }, ownerId: string | null | undefined) {
  return !!ownerId && (ownerId === user.id || ownerId === user.raw_uid);
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

async function loadOwnedVehicle(request: Request, id: string) {
  const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
  if (authError || !user) {
    return { error: authError || "Authentication required", status: authStatus || 401, user: null, vehicle: null };
  }

  const { data, error } = await supabaseAdmin.from("vehicles").select("*").eq("id", id).maybeSingle();
  if (error) return { error: error.message, status: 500, user, vehicle: null };
  if (!data || !owns(user, data.user_id)) {
    return { error: "Vehicle not found", status: 404, user, vehicle: null };
  }
  return { error: null, status: 200, user, vehicle: data };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const loaded = await loadOwnedVehicle(request, id);
    if (loaded.error || !loaded.vehicle) {
      return NextResponse.json({ error: loaded.error }, { status: loaded.status });
    }
    return NextResponse.json({ vehicle: mapVehicle(loaded.vehicle) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const loaded = await loadOwnedVehicle(request, id);
    if (loaded.error || !loaded.vehicle || !loaded.user) {
      return NextResponse.json({ error: loaded.error }, { status: loaded.status });
    }

    const body = await request.json();
    const updates: Record<string, any> = {};
    if (body.type !== undefined) updates.type = body.type;
    if (body.bodyType !== undefined) updates.body_type = body.bodyType;
    if (body.make !== undefined) updates.make = body.make;
    if (body.model !== undefined) updates.model = body.model;
    if (body.registrationNumber !== undefined) updates.registration_number = body.registrationNumber;
    if (body.nickname !== undefined) updates.nickname = body.nickname;
    if (body.color !== undefined) updates.color = body.color;
    if (body.isManual !== undefined) updates.is_manual = body.isManual;

    const { data, error } = await supabaseAdmin
      .from("vehicles")
      .update(updates)
      .eq("id", id)
      .eq("user_id", loaded.vehicle.user_id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Could not update vehicle" }, { status: 500 });
    }

    return NextResponse.json({ vehicle: mapVehicle(data) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const loaded = await loadOwnedVehicle(request, id);
    if (loaded.error || !loaded.vehicle) {
      return NextResponse.json({ error: loaded.error }, { status: loaded.status });
    }

    const { error } = await supabaseAdmin
      .from("vehicles")
      .delete()
      .eq("id", id)
      .eq("user_id", loaded.vehicle.user_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Vehicle deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
