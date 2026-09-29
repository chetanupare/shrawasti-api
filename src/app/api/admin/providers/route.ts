import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const DEFAULT_PROVIDERS = [
  {
    id: "prov_101",
    name: "Ramesh Kumar",
    phone: "+91 9876543210",
    email: "ramesh.k@shrawasti.com",
    rating: 4.9,
    totalJobs: 42,
    isOnline: true,
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "prov_102",
    name: "Suresh Sharma",
    phone: "+91 9812345678",
    email: "suresh.s@shrawasti.com",
    rating: 4.8,
    totalJobs: 28,
    isOnline: true,
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "prov_103",
    name: "Amit Singh",
    phone: "+91 9765432109",
    email: "amit.singh@shrawasti.com",
    rating: 5.0,
    totalJobs: 15,
    isOnline: false,
    status: "active",
    createdAt: new Date().toISOString(),
  },
];

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
      return NextResponse.json({ providers: DEFAULT_PROVIDERS });
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
    return NextResponse.json({ providers: DEFAULT_PROVIDERS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, profileImage, status, rating } = body;

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
      rating: rating ? parseFloat(rating) : 5.0,
      total_jobs: 0,
    };

    const { data, error } = await supabaseAdmin
      .from("providers")
      .insert(newProvider)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ provider: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, phone, email, status, rating, isOnline } = body;

    if (!id) {
      return NextResponse.json({ error: "Provider ID is required" }, { status: 400 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (status !== undefined) updates.status = status;
    if (rating !== undefined) updates.rating = parseFloat(rating);
    if (isOnline !== undefined) updates.is_online = isOnline;

    const { data, error } = await supabaseAdmin
      .from("providers")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, provider: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");
    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: "Provider ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("providers").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
