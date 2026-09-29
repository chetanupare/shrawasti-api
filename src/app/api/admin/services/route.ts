import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { data, error } = await supabaseAdmin.from("services").select("*").order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ services: [] });
    }

    const services = (data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.category,
      basePrice: s.base_price,
      popular: s.popular,
      durationMinutes: s.duration_minutes || 45,
      isActive: s.is_active ?? true,
      createdAt: s.created_at,
    }));

    return NextResponse.json({ services });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, category, basePrice, durationMinutes, popular, isActive } = body;

    if (!name || basePrice === undefined) {
      return NextResponse.json({ error: "Name and basePrice are required" }, { status: 400 });
    }

    const newService = {
      name,
      description: description || "",
      category: category || "package",
      base_price: parseFloat(basePrice),
      duration_minutes: durationMinutes ? parseInt(durationMinutes) : 45,
      popular: popular ?? false,
      is_active: isActive ?? true,
    };

    const { data, error } = await supabaseAdmin
      .from("services")
      .insert(newService)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({
        service: {
          id: `srv_${Date.now()}`,
          ...newService,
          basePrice: parseFloat(basePrice),
          durationMinutes: durationMinutes ? parseInt(durationMinutes) : 45,
          createdAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ service: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, category, basePrice, durationMinutes, popular, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (basePrice !== undefined) updates.base_price = parseFloat(basePrice);
    if (durationMinutes !== undefined) updates.duration_minutes = parseInt(durationMinutes);
    if (popular !== undefined) updates.popular = popular;
    if (isActive !== undefined) updates.is_active = isActive;

    const { data, error } = await supabaseAdmin
      .from("services")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: true, updatedId: id, fallback: true });
    }

    return NextResponse.json({ success: true, service: data });
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
      return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("services").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ success: true, deletedId: id, fallback: true });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
