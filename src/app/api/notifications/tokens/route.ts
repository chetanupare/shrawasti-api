import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, token, platform } = body;

    if (!userId || !token) {
      return NextResponse.json({ error: "userId and token are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("user_device_tokens")
      .upsert(
        {
          user_id: userId,
          token: token,
          platform: platform || "android",
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "token" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, token: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "token parameter is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("user_device_tokens")
      .update({ is_active: false })
      .eq("token", token);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Device token deactivated" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
