import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuthenticatedUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { error: authError, status, user } = await requireAuthenticatedUser(request);
    if (authError || !user) return NextResponse.json({ error: authError || "Authentication required" }, { status: status || 401 });

    const payload = await request.json().catch(() => ({}));
    const name = String(payload.name || "");
    if (!/^[a-z0-9_]{1,64}$/.test(name)) {
      return NextResponse.json({ error: "Invalid event name" }, { status: 400 });
    }

    const properties = payload.properties && typeof payload.properties === "object" && !Array.isArray(payload.properties)
      ? payload.properties
      : {};
    if (JSON.stringify(properties).length > 2000) {
      return NextResponse.json({ error: "Event properties are too large" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("analytics_events").insert({
      user_id: user.id,
      name,
      properties,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
