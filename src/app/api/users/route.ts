import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { requireAuth } from "@/middleware/auth";

export async function GET(request: Request) {
  try {
    // Get authenticated user
    const { error: authError, user } = await requireAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", user.userId)
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
    const { error: authError, user } = await requireAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, profileImage } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const userData: Record<string, any> = {
      id: user.userId,
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