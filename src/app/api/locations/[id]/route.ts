import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuthenticatedUser } from "@/lib/auth";

function owns(user: { id: string; raw_uid?: string }, ownerId: string | null | undefined) {
  return !!ownerId && (ownerId === user.id || ownerId === user.raw_uid);
}

function mapLocation(loc: any) {
  return {
    id: loc.id,
    userId: loc.user_id,
    label: loc.label,
    latitude: loc.latitude,
    longitude: loc.longitude,
    address: loc.address,
    buildingName: loc.building_name,
    houseNumber: loc.house_number,
    landmark: loc.landmark,
    createdAt: loc.created_at,
    updatedAt: loc.updated_at,
  };
}

async function loadOwnedLocation(request: Request, id: string) {
  const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
  if (authError || !user) {
    return { error: authError || "Authentication required", status: authStatus || 401, location: null };
  }

  const { data, error } = await supabaseAdmin.from("saved_locations").select("*").eq("id", id).maybeSingle();
  if (error) return { error: error.message, status: 500, location: null };
  if (!data || !owns(user, data.user_id)) {
    return { error: "Location not found", status: 404, location: null };
  }
  return { error: null, status: 200, location: data };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const loaded = await loadOwnedLocation(request, id);
    if (loaded.error || !loaded.location) {
      return NextResponse.json({ error: loaded.error }, { status: loaded.status });
    }
    return NextResponse.json({ location: mapLocation(loaded.location) });
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
    const loaded = await loadOwnedLocation(request, id);
    if (loaded.error || !loaded.location) {
      return NextResponse.json({ error: loaded.error }, { status: loaded.status });
    }

    const body = await request.json();
    const updates: Record<string, any> = {};
    if (body.label !== undefined) updates.label = body.label;
    if (body.latitude !== undefined) updates.latitude = body.latitude;
    if (body.longitude !== undefined) updates.longitude = body.longitude;
    if (body.address !== undefined) updates.address = body.address;
    if (body.buildingName !== undefined) updates.building_name = body.buildingName;
    if (body.houseNumber !== undefined) updates.house_number = body.houseNumber;
    if (body.landmark !== undefined) updates.landmark = body.landmark;

    const { data, error } = await supabaseAdmin
      .from("saved_locations")
      .update(updates)
      .eq("id", id)
      .eq("user_id", loaded.location.user_id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Could not update location" }, { status: 500 });
    }

    return NextResponse.json({ location: mapLocation(data) });
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
    const loaded = await loadOwnedLocation(request, id);
    if (loaded.error || !loaded.location) {
      return NextResponse.json({ error: loaded.error }, { status: loaded.status });
    }

    const { error } = await supabaseAdmin
      .from("saved_locations")
      .delete()
      .eq("id", id)
      .eq("user_id", loaded.location.user_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Location deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
