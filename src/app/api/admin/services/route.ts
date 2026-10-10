import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { loadServicePrices, saveServicePrices } from "@/lib/servicePrices";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleType = searchParams.get("vehicleType");
    const bodyType = searchParams.get("bodyType");

    let query = supabaseAdmin.from("services").select("*").order("created_at", { ascending: true });

    if (vehicleType && vehicleType !== "all") {
      query = query.or(`vehicle_type.ilike.%${vehicleType}%,category.ilike.%${vehicleType}%`);
    }

    if (bodyType && bodyType !== "all") {
      query = query.ilike("body_type", `%${bodyType}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const priceMap = await loadServicePrices((data || []).map((s: any) => s.id));

    const services = (data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.category || "car_wash",
      vehicleType: s.vehicle_type || (s.category?.includes("2w") || s.category?.includes("bike") ? "2W" : "4W"),
      bodyType: s.body_type || "All",
      basePrice: s.base_price,
      prices: priceMap[s.id] || {},
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
    const { name, description, category, vehicleType, bodyType, basePrice, durationMinutes, popular, isActive, prices } = body;

    if (!name || basePrice === undefined) {
      return NextResponse.json({ error: "Name and basePrice are required" }, { status: 400 });
    }

    const newService: any = {
      name,
      description: description || "",
      category: category || (vehicleType === "2W" ? "2w_wash" : "4w_wash"),
      base_price: parseFloat(basePrice),
      duration_minutes: durationMinutes ? parseInt(durationMinutes) : 45,
      popular: popular ?? false,
      is_active: isActive ?? true,
    };

    if (vehicleType) newService.vehicle_type = vehicleType;
    if (bodyType) newService.body_type = bodyType;

    const { data, error } = await supabaseAdmin
      .from("services")
      .insert(newService)
      .select()
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Could not create service" }, { status: 500 });
    }

    await saveServicePrices(data.id, prices);

    return NextResponse.json({ service: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, category, vehicleType, bodyType, basePrice, durationMinutes, popular, isActive, prices } = body;

    if (!id) {
      return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (vehicleType !== undefined) updates.vehicle_type = vehicleType;
    if (bodyType !== undefined) updates.body_type = bodyType;
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await saveServicePrices(id, prices);

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

    await supabaseAdmin.from("service_prices").delete().eq("service_id", id);
    const { error } = await supabaseAdmin.from("services").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
