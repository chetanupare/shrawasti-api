import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("saved_locations")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    return NextResponse.json({
      location: {
        id: data.id,
        userId: data.user_id,
        label: data.label,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        buildingName: data.building_name,
        houseNumber: data.house_number,
        landmark: data.landmark,
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
    if (body.label !== undefined) updates.label = body.label;
    if (body.latitude !== undefined) updates.latitude = body.latitude;
    if (body.longitude !== undefined) updates.longitude = body.longitude;
    if (body.address !== undefined) updates.address = body.address;
    if (body.buildingName !== undefined) updates.building_name = body.buildingName;
    if (body.houseNumber !== undefined) updates.house_number = body.houseNumber;
    if (body.landmark !== undefined) updates.landmark = body.landmark;

    const { data, error } = await supabase
      .from("saved_locations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      location: {
        id: data.id,
        userId: data.user_id,
        label: data.label,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        buildingName: data.building_name,
        houseNumber: data.house_number,
        landmark: data.landmark,
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
    const { error } = await supabase.from("saved_locations").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Location deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
