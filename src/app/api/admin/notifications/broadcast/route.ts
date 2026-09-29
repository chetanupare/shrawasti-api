import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const [tokensRes, historyRes] = await Promise.all([
      supabaseAdmin.from("device_tokens").select("*").order("updated_at", { ascending: false }),
      supabaseAdmin.from("broadcast_notifications").select("*").order("sent_at", { ascending: false }),
    ]);

    const deviceTokens = (tokensRes.data || []).map((t: any) => ({
      id: t.id,
      userId: t.user_id || t.userId,
      pushToken: t.push_token || t.pushToken,
      platform: t.platform || "expo",
      deviceModel: t.device_model || t.deviceModel || "Mobile",
      isActive: t.is_active ?? true,
      updatedAt: t.updated_at,
    }));

    const history = (historyRes.data || []).map((h: any) => ({
      id: h.id,
      title: h.title,
      body: h.body,
      targetAudience: h.target_audience || "all",
      recipientsCount: h.recipients_count || 0,
      sentAt: h.sent_at,
    }));

    return NextResponse.json({ deviceTokens, history });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message, targetAudience } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message body are required" }, { status: 400 });
    }

    // Fetch registered active tokens
    const { data: tokens } = await supabaseAdmin.from("device_tokens").select("push_token").eq("is_active", true);
    const count = (tokens || []).length;

    // Log the broadcast in Supabase
    const { data, error } = await supabaseAdmin
      .from("broadcast_notifications")
      .insert({
        title,
        body: message,
        target_audience: targetAudience || "all",
        recipients_count: count,
      })
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, broadcast: data, recipientsCount: count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
