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
      .from("saved_locations")
      .select("*")
      .or(`user_id.eq.${userId},user_id.eq.${uuid}`)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const locations = (data || []).map((loc) => ({
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
    }));

    return NextResponse.json({ locations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, label, latitude, longitude, address, buildingName, houseNumber, landmark } = body;

    if (!userId || latitude === undefined || longitude === undefined || !address) {
      return NextResponse.json(
        { error: "Missing required location fields (userId, latitude, longitude, address)" },
        { status: 400 }
      );
    }

    // Ensure user exists to satisfy foreign key constraint
    await supabase.from("users").upsert({ id: userId, name: "User" }, { onConflict: "id" });

    const newLocation = {
      user_id: userId,
      label: label || "Home",
      latitude,
      longitude,
      address,
      building_name: (buildingName && buildingName.trim() !== '') ? buildingName.trim() : (address ? address.split(',')[0] : 'Location'),
      house_number: houseNumber || null,
      landmark: landmark || null,
    };

    const { data, error } = await supabase
      .from("saved_locations")
      .insert(newLocation)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
