import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("saved_locations")
      .select("*")
      .eq("user_id", userId)
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

    if (!userId || latitude === undefined || longitude === undefined || !address || !buildingName) {
      return NextResponse.json(
        { error: "Missing required location fields (userId, latitude, longitude, address, buildingName)" },
        { status: 400 }
      );
    }

    const newLocation = {
      user_id: userId,
      label: label || "Home",
      latitude,
      longitude,
      address,
      building_name: buildingName,
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
