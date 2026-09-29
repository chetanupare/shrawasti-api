import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const DEFAULT_VEHICLES = [
  { id: "v_1", brand: "Tata", model: "Nexon", category: "Car", bodyType: "SUV" },
  { id: "v_2", brand: "Tata", model: "Punch", category: "Car", bodyType: "Compact SUV" },
  { id: "v_3", brand: "Hyundai", model: "Creta", category: "Car", bodyType: "SUV" },
  { id: "v_4", brand: "Maruti", model: "Swift", category: "Car", bodyType: "Hatchback" },
  { id: "v_5", brand: "Honda", model: "City", category: "Car", bodyType: "Sedan" },
  { id: "v_6", brand: "Mahindra", model: "Thar", category: "Car", bodyType: "SUV" },
  { id: "v_7", brand: "Hero", model: "Splendor Plus", category: "Bike", bodyType: "Standard" },
  { id: "v_8", brand: "Honda", model: "Activa 6G", category: "Bike", bodyType: "Scooter" },
  { id: "v_9", brand: "Royal Enfield", model: "Classic 350", category: "Bike", bodyType: "Cruiser" },
  { id: "v_10", brand: "TVS", model: "Jupiter", category: "Bike", bodyType: "Scooter" },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");

    let query = supabaseAdmin.from("vehicle_catalog").select("*");

    if (category) {
      const catSearch = category.toLowerCase().includes("bike") || category === "2w" ? "Bike" : "Car";
      query = query.ilike("category", `%${catSearch}%`);
    }

    if (brand) {
      query = query.ilike("brand", `%${brand}%`);
    }

    const { data, error } = await query.order("brand", { ascending: true });

    if (error) {
      return NextResponse.json({ catalog: DEFAULT_VEHICLES });
    }

    const catalog = (data || []).map((c: any) => ({
      id: c.id,
      brand: c.brand,
      model: c.model,
      category: c.category,
      bodyType: c.body_type ?? null,
      brandIcon: c.brand_icon ?? null,
      modelImage: c.model_image ?? null,
      createdAt: c.created_at,
    }));

    return NextResponse.json({ catalog });
  } catch (err: any) {
    return NextResponse.json({ catalog: DEFAULT_VEHICLES });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { brand, model, category, bodyType, brandIcon, modelImage } = body;

    if (!brand || !model) {
      return NextResponse.json({ error: "Brand and model are required" }, { status: 400 });
    }

    const newItem = {
      brand,
      model,
      category: category || "Car",
      body_type: bodyType || "Hatchback",
      brand_icon: brandIcon || null,
      model_image: modelImage || null,
    };

    const { data, error } = await supabaseAdmin
      .from("vehicle_catalog")
      .insert(newItem)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ vehicle: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, brand, model, category, bodyType, brandIcon, modelImage } = body;

    if (!id) {
      return NextResponse.json({ error: "Vehicle item ID is required" }, { status: 400 });
    }

    const updates: any = {};
    if (brand !== undefined) updates.brand = brand;
    if (model !== undefined) updates.model = model;
    if (category !== undefined) updates.category = category;
    if (bodyType !== undefined) updates.body_type = bodyType;
    if (brandIcon !== undefined) updates.brand_icon = brandIcon;
    if (modelImage !== undefined) updates.model_image = modelImage;

    const { data, error } = await supabaseAdmin
      .from("vehicle_catalog")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, vehicle: data });
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
      return NextResponse.json({ error: "Vehicle item ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("vehicle_catalog").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
