import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const DEFAULT_SERVICES = [
  {
    id: "srv_1",
    name: "Basic Doorstep Wash",
    description: "Complete exterior pressure wash, micro-fiber wipe down, and window cleaning.",
    category: "package",
    basePrice: 399,
    durationMinutes: 45,
    popular: false,
    isActive: true,
  },
  {
    id: "srv_2",
    name: "Premium Foam & Shine",
    description: "pH-neutral snow foam bath, high-gloss wax sealant, interior vacuum & dashboard polish.",
    category: "package",
    basePrice: 699,
    durationMinutes: 60,
    popular: true,
    isActive: true,
  },
  {
    id: "srv_3",
    name: "Full Interior Deep Sanitization",
    description: "Steam extraction cleaning of seats, carpets, headliner, and anti-bacterial fogging.",
    category: "package",
    basePrice: 999,
    durationMinutes: 90,
    popular: false,
    isActive: true,
  },
  {
    id: "srv_4",
    name: "Tyre & Bumper Dressing",
    description: "Deep tire degreasing and non-slung hydrophobic shine coating.",
    category: "add_on",
    basePrice: 199,
    durationMinutes: 15,
    popular: false,
    isActive: true,
  },
  {
    id: "srv_5",
    name: "Engine Bay Detail",
    description: "Safe waterless engine compartment degreasing and protective rubber dressing.",
    category: "add_on",
    basePrice: 299,
    durationMinutes: 20,
    popular: true,
    isActive: true,
  },
];

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
      return NextResponse.json({ services: DEFAULT_SERVICES });
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
    return NextResponse.json({ services: DEFAULT_SERVICES });
  }
}
