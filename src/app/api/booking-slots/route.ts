import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase.from("booking_slots").select("*").eq("is_active", true).order("id", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const seen = new Set<string>();
    const slots = (data || []).flatMap((s: any) => {
      const slotTime = String(s.slot_time || s.slotTime || '').trim();
      const key = slotTime.toLowerCase().replace(/\s+/g, ' ');
      if (!key || seen.has(key)) return [];
      seen.add(key);
      return [{
        id: s.id,
        slotTime,
        maxCapacity: s.max_capacity || s.maxCapacity || 10,
      }];
    });

    return NextResponse.json({ slots });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}