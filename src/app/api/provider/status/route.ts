import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireProviderUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { error: authError, status: authStatus, provider } = await requireProviderUser(request);
    if (authError || !provider) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const body = await request.json();
    const { isOnline } = body;

    if (isOnline === undefined) {
      return NextResponse.json(
        { error: "isOnline field is required" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      is_online: Boolean(isOnline),
      updated_at: new Date().toISOString(),
    };

    // Availability is is_online. status stays the account flag.
    // Rows previously stuck on offline/available are restored so jobs can be accepted.
    const accountStatus = String(provider.status || "").toLowerCase();
    if (accountStatus === "offline" || accountStatus === "available" || accountStatus === "") {
      updates.status = "active";
    }

    const { data, error } = await supabaseAdmin
      .from("providers")
      .update(updates)
      .eq("id", provider.id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      provider: data ? {
        id: data.id,
        isOnline: data.is_online,
        status: data.status,
        updatedAt: data.updated_at,
      } : { providerId: provider.id, isOnline, status: updates.status },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
