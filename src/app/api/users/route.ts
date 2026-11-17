import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth } from "@/middleware/auth";

function digits(value: unknown) {
  return String(value || "").replace(/\D/g, "").slice(-10);
}

function toUser(data: any) {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    profileImage: data.profile_image,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

async function findUser(userId: string, phone: string) {
  if (phone.length >= 10) {
    const { data: byPhone, error: phoneError } = await supabaseAdmin
      .from("users")
      .select("*")
      .in("phone", [phone, `91${phone}`, `+91${phone}`])
      .limit(1);
    if (phoneError) return { data: null, error: phoneError };
    if (byPhone?.[0]) return { data: byPhone[0], error: null };
  }

  const { data: byId, error: idError } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return { data: byId, error: idError };
}

export async function GET(request: Request) {
  try {
    // Get authenticated user
    const { error: authError, user } = await requireAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await findUser(user.userId, digits(user.phone));

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
    const cleanName = String(name || "").trim();
    const cleanPhone = digits(phone || user.phone);

    if (cleanName.length < 2) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const found = await findUser(user.userId, cleanPhone);
    if (found.error) {
      return NextResponse.json({ error: found.error.message }, { status: 500 });
    }

    const userData: Record<string, any> = {
      name: cleanName,
      updated_at: new Date().toISOString(),
    };
    if (email !== undefined) userData.email = email || null;
    if (cleanPhone) userData.phone = cleanPhone;
    if (profileImage !== undefined) userData.profile_image = profileImage || null;

    const write = found.data
      ? supabaseAdmin.from("users").update(userData).eq("id", found.data.id).select().single()
      : supabaseAdmin.from("users").insert({
          id: user.userId,
          role: "customer",
          created_at: new Date().toISOString(),
          ...userData,
        }).select().single();

    const { data, error } = await write;

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Could not save name" }, { status: 500 });
    }

    if (String(data.name || "").trim() !== cleanName) {
      return NextResponse.json({ error: "Name was not saved" }, { status: 500 });
    }

    return NextResponse.json({ user: toUser(data) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}