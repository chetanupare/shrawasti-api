import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    return NextResponse.json({
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
    });
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

    const { data, error } = await supabase
      .from("vehicles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
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
    });
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
    const { error } = await supabase.from("vehicles").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Vehicle deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
