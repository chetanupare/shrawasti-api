import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuthenticatedUser } from "@/lib/auth";
import { queryProviderByPhoneOrId } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId") || searchParams.get("phone");

    if (!providerId) {
      return NextResponse.json({ error: "providerId or phone parameter is required" }, { status: 400 });
    }

    const userPhone = user?.phone || user?.user_metadata?.phone || providerId;
    let provider = await queryProviderByPhoneOrId(providerId);
    if (!provider && userPhone) {
      provider = await queryProviderByPhoneOrId(userPhone);
    }

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    return NextResponse.json({
      provider: {
        id: provider.id,
        name: provider.name,
        phone: provider.phone,
        email: provider.email,
        profileImage: provider.profile_image,
        rating: parseFloat(provider.rating || 5.0),
        totalJobs: provider.total_jobs || 0,
        isOnline: provider.is_online ?? true,
        status: provider.status || "active",
        currentLat: provider.current_lat,
        currentLng: provider.current_lng,
        createdAt: provider.created_at,
        updatedAt: provider.updated_at,
      },
    });
  } catch (err: any) {
    console.error("[ProviderProfile API Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const body = await request.json();
    const { id, name, phone, email, profileImage, isOnline } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "id and name are required" }, { status: 400 });
    }

    if (id !== user.id) {
      return NextResponse.json({ error: "Forbidden: Cannot modify other provider profiles" }, { status: 403 });
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
