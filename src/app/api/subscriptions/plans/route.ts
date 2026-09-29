import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const plans = (data || []).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      benefits: p.benefits,
      validityDays: p.validity_days,
      popular: p.popular,
      isActive: p.is_active,
      prices: p.prices,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return NextResponse.json({ plans });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
