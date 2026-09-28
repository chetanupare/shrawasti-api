import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const vehicleType = searchParams.get("vehicleType");

    let query = supabase.from("services").select("*").eq("is_active", true);

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map snake_case to camelCase if needed
    const services = (data || []).map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.category,
      basePrice: s.base_price,
      prices: s.prices,
      popular: s.popular,
      durationMinutes: s.duration_minutes,
      iconUrl: s.icon_url,
      isActive: s.is_active,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));

    return NextResponse.json({ services });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
