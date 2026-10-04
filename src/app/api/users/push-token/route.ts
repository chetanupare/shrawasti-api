import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuthenticatedUser, ensureUserExists } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || "Authentication required" }, { status: authStatus || 401 });
    }

    await ensureUserExists(user);

    const body = await request.json();
    const { pushToken, platform } = body;

    if (!pushToken || typeof pushToken !== "string") {
      return NextResponse.json({ error: "pushToken is required" }, { status: 400 });
    }

    // Update user's push token in users table
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({
        push_token: pushToken,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Push token registered successfully",
      userId: user.id,
      platform: platform || "mobile",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
