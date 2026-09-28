import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");

    let query = supabase.from("vehicle_catalog").select("*");

    if (category) {
      const catSearch = category.toLowerCase().includes("bike") || category === "2w" ? "Bike" : "Car";
      query = query.ilike("category", `%${catSearch}%`);
    }

    if (brand) {
      query = query.ilike("brand", `%${brand}%`);
    }

    const { data, error } = await query.order("brand", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const catalog = (data || []).map((c) => ({
      id: c.id,
      brand: c.brand,
      model: c.model,
      category: c.category,
      driveType: c.drive_type ?? null,
      year: c.year,
      licensePlate: c.license_plate,
      exteriorColor: c.exterior_color,
      brandIcon: c.brand_icon ?? null,
      modelImage: c.model_image ?? null,
      bodyType: c.body_type ?? null,
    }));

    return NextResponse.json({ catalog });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
