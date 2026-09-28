import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, category, basePrice, prices, popular, durationMinutes, iconUrl } = body;

    if (!name || !category || basePrice === undefined) {
      return NextResponse.json(
        { error: "name, category, and basePrice are required" },
        { status: 400 }
      );
    }

    const newService = {
      name,
      description: description || "",
      category,
      base_price: basePrice,
      prices: prices || { Hatchback: basePrice, Sedan: basePrice + 50, SUV: basePrice + 100, "7 Seater": basePrice + 150 },
      popular: popular ?? false,
      duration_minutes: durationMinutes || 45,
      icon_url: iconUrl || null,
      is_active: true,
    };

    const { data, error } = await supabaseAdmin
      .from("services")
      .insert(newService)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ service: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, category, basePrice, prices, popular, durationMinutes, iconUrl, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Service id is required" }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (basePrice !== undefined) updates.base_price = basePrice;
    if (prices !== undefined) updates.prices = prices;
    if (popular !== undefined) updates.popular = popular;
    if (durationMinutes !== undefined) updates.duration_minutes = durationMinutes;
    if (iconUrl !== undefined) updates.icon_url = iconUrl;
    if (isActive !== undefined) updates.is_active = isActive;

    const { data, error } = await supabaseAdmin
      .from("services")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ service: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
