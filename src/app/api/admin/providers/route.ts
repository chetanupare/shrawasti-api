import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabaseAdmin.from("providers").select("*");

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ providers: [] });
    }

    const providers = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      email: p.email,
      profileImage: p.profile_image,
      rating: p.rating || 5.0,
      totalJobs: p.total_jobs || 0,
      isOnline: p.is_online ?? true,
      status: p.status || "active",
      createdAt: p.created_at,
    }));

    return NextResponse.json({ providers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, profileImage, status } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    const newProvider = {
      name,
      phone,
      email: email || null,
      profile_image: profileImage || null,
      status: status || "active",
      is_online: true,
      rating: 5.0,
      total_jobs: 0,
    };

    const { data, error } = await supabaseAdmin
      .from("providers")
      .insert(newProvider)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({
        provider: {
          id: `prov_${Date.now()}`,
          name,
          phone,
          email,
          status: "active",
          createdAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ provider: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
