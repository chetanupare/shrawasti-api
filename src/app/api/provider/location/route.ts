import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireProviderUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { error: authError, status: authStatus, provider } = await requireProviderUser(request);
    if (authError || !provider) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const body = await request.json();
    const { latitude, longitude, heading, speed } = body;

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "latitude and longitude fields are required" },
        { status: 400 }
      );
    }

    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
      return NextResponse.json({ error: "Invalid latitude" }, { status: 422 });
    }

    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: "Invalid longitude" }, { status: 422 });
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
      .eq("id", provider.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      providerId: provider.id,
      location: { latitude, longitude, heading, speed },
      timestamp: locationUpdate.updated_at,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { error: authError, status: authStatus, provider } = await requireProviderUser(request);
    if (authError || !provider) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const { data, error } = await supabase
      .from("providers")
      .select("id, current_lat, current_lng, heading, speed, updated_at")
      .eq("id", provider.id)
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
