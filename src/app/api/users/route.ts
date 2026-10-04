import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { getFirebaseUuid } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
    }

    const uuid = getFirebaseUuid(userId) || userId;

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .or(`id.eq.${userId},id.eq.${uuid}`)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        profileImage: data.profile_image,
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
    const { id, name, email, phone, profileImage } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "id and name are required" }, { status: 400 });
    }

    const userData: Record<string, any> = {
      id,
      name,
      updated_at: new Date().toISOString(),
    };
    if (email !== undefined) userData.email = email || null;
    if (phone !== undefined) userData.phone = phone || null;
    if (profileImage !== undefined) userData.profile_image = profileImage || null;

    const { data, error } = await supabaseAdmin
      .from("users")
      .upsert(userData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        profileImage: data.profile_image,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}
