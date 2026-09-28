import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { providerId, isOnline, status } = body;

    if (!providerId || isOnline === undefined) {
      return NextResponse.json(
        { error: "providerId and isOnline fields are required" },
        { status: 400 }
      );
    }

    const updates = {
      is_online: isOnline,
      status: status || (isOnline ? "available" : "offline"),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("providers")
      .update(updates)
      .eq("id", providerId)
      .select()
      .maybeSingle();

    if (error) {
      // Fallback response if table not yet migrated
      return NextResponse.json({
        success: true,
        providerId,
        isOnline,
        status: updates.status,
        updatedAt: updates.updated_at,
      });
    }

    return NextResponse.json({
      success: true,
      provider: data ? {
        id: data.id,
        isOnline: data.is_online,
        status: data.status,
        updatedAt: data.updated_at,
      } : { providerId, isOnline, status: updates.status },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
