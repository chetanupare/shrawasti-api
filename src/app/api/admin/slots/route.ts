import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from("booking_slots").select("*").order("id", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const slots = (data || []).map((s: any) => ({
      id: s.id,
      slotTime: s.slot_time || s.slotTime,
      maxCapacity: s.max_capacity || s.maxCapacity || 10,
      isActive: s.is_active ?? true,
    }));

    return NextResponse.json({ slots });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slotTime, maxCapacity, isActive } = body;

    if (!slotTime) {
      return NextResponse.json({ error: "slotTime is required" }, { status: 400 });
    }

    const newSlot = {
      slot_time: slotTime,
      max_capacity: maxCapacity ? parseInt(maxCapacity) : 10,
      is_active: isActive ?? true,
    };

    const { data, error } = await supabaseAdmin
      .from("booking_slots")
      .insert(newSlot)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ slot: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, slotTime, maxCapacity, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Slot ID is required" }, { status: 400 });
    }

    const updates: any = {};
    if (slotTime !== undefined) updates.slot_time = slotTime;
    if (maxCapacity !== undefined) updates.max_capacity = parseInt(maxCapacity);
    if (isActive !== undefined) updates.is_active = isActive;

    const { data, error } = await supabaseAdmin
      .from("booking_slots")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, slot: data });
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
      return NextResponse.json({ error: "Slot ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("booking_slots").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
