import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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
    const { data, error } = await supabaseAdmin.from("services").select("*").order("created_at", { ascending: true });

    if (error || !data || data.length === 0) {
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

    return NextResponse.json({ services: services.length > 0 ? services : DEFAULT_SERVICES });
  } catch (err: any) {
    return NextResponse.json({ services: DEFAULT_SERVICES });
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
