import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { loadServicePrices } from "@/lib/servicePrices";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = supabase.from("services").select("*").eq("is_active", true);

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const priceMap = await loadServicePrices((data || []).map((s: any) => s.id));

    const services = (data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.category,
      basePrice: Number(s.base_price) || 0,
      popular: s.popular,
      prices: priceMap[s.id] || {},
      durationMinutes: s.duration_minutes || 45,
      isActive: s.is_active ?? true,
      createdAt: s.created_at,
    }));

    return NextResponse.json({ services });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
