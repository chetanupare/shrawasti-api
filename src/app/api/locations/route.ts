import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureUserExists, requireAuthenticatedUser } from "@/lib/auth";

function ownerIds(user: { id: string; raw_uid?: string }) {
  return [user.id, user.raw_uid].filter(Boolean);
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

export async function GET(request: Request) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || "Authentication required" }, { status: authStatus || 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("saved_locations")
      .select("*")
      .in("user_id", ownerIds(user))
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ locations: (data || []).map(mapLocation) });
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
    const { label, latitude, longitude, address, buildingName, houseNumber, landmark } = body;

    if (latitude === undefined || longitude === undefined || !address) {
      return NextResponse.json(
        { error: "Missing required location fields (latitude, longitude, address)" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("saved_locations")
      .insert({
        user_id: user.id,
        label: label || "Home",
        latitude,
        longitude,
        address,
        building_name: (buildingName && String(buildingName).trim() !== "")
          ? String(buildingName).trim()
          : (address ? String(address).split(",")[0] : "Location"),
        house_number: houseNumber || null,
        landmark: landmark || null,
      })
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Could not save location" }, { status: 500 });
    }

    return NextResponse.json({ location: mapLocation(data) }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
