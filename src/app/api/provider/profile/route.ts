import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId");

    if (!providerId) {
      return NextResponse.json({ error: "providerId parameter is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("providers")
      .select("*")
      .eq("id", providerId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    return NextResponse.json({
      provider: {
        id: data.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        profileImage: data.profile_image,
        rating: data.rating || 5.0,
        totalJobs: data.total_jobs || 0,
        isOnline: data.is_online ?? true,
        status: data.status || "active",
        currentLat: data.current_lat,
        currentLng: data.current_lng,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, phone, email, profileImage, isOnline } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "id and name are required" }, { status: 400 });
    }

    const providerData = {
      id,
      name,
      phone: phone || null,
      email: email || null,
      profile_image: profileImage || null,
      is_online: isOnline ?? true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("providers")
      .upsert(providerData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      provider: {
        id: data.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        profileImage: data.profile_image,
        rating: data.rating,
        totalJobs: data.total_jobs,
        isOnline: data.is_online,
        status: data.status,
        updatedAt: data.updated_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
