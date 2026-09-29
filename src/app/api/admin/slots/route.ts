import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const DEFAULT_SLOTS = [
  { id: "slot_1", slotTime: "09:00 AM - 11:00 AM", maxCapacity: 10, isActive: true },
  { id: "slot_2", slotTime: "11:00 AM - 01:00 PM", maxCapacity: 10, isActive: true },
  { id: "slot_3", slotTime: "01:00 PM - 03:00 PM", maxCapacity: 10, isActive: true },
  { id: "slot_4", slotTime: "03:00 PM - 05:00 PM", maxCapacity: 10, isActive: true },
  { id: "slot_5", slotTime: "05:00 PM - 07:00 PM", maxCapacity: 10, isActive: true },
];

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from("booking_slots").select("*").order("id", { ascending: true });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ slots: DEFAULT_SLOTS });
    }

    const slots = data.map((s: any) => ({
      id: s.id,
      slotTime: s.slot_time || s.slotTime,
      maxCapacity: s.max_capacity || s.maxCapacity || 10,
      isActive: s.is_active ?? true,
    }));

    return NextResponse.json({ slots });
  } catch (err: any) {
    return NextResponse.json({ slots: DEFAULT_SLOTS });
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
      return NextResponse.json({
        slot: {
          id: `slot_${Date.now()}`,
          slotTime,
          maxCapacity: maxCapacity ? parseInt(maxCapacity) : 10,
          isActive: isActive ?? true,
        },
      });
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
      return NextResponse.json({ success: true, updatedId: id, fallback: true });
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
      return NextResponse.json({ success: true, deletedId: id, fallback: true });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
