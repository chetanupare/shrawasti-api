import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { providerId, latitude, longitude, heading, speed } = body;

    if (!providerId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "providerId, latitude, and longitude fields are required" },
        { status: 400 }
      );
    }

    const locationUpdate = {
      current_lat: latitude,
      current_lng: longitude,
      heading: heading || 0,
      speed: speed || 0,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("providers")
      .update(locationUpdate)
      .eq("id", providerId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      providerId,
      location: { latitude, longitude, heading, speed },
      timestamp: locationUpdate.updated_at,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId");

    if (!providerId) {
      return NextResponse.json({ error: "providerId parameter is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("providers")
      .select("id, current_lat, current_lng, heading, speed, updated_at")
      .eq("id", providerId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Provider location not found" }, { status: 404 });
    }

    return NextResponse.json({
      providerId: data.id,
      location: {
        latitude: data.current_lat,
        longitude: data.current_lng,
        heading: data.heading || 0,
        speed: data.speed || 0,
      },
      timestamp: data.updated_at,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
