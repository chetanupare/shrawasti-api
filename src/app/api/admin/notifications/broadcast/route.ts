import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { sendToMultipleUsers } from "@/lib/notifications";

export async function GET(request: Request) {
  try {
    const { error: authError, status: authStatus } = await requireAdminUser(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, user_id, platform, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (subError) {
      return NextResponse.json({ error: subError.message, deviceTokens: [], history: [] }, { status: 500 });
    }

    const { data: notes } = await supabaseAdmin
      .from("notifications")
      .select("id, title, message, created_at")
      .eq("type", "announcement")
      .order("created_at", { ascending: false })
      .limit(100);

    const historyMap = new Map<string, { id: string; title: string; body: string; sentAt: string; recipientsCount: number }>();
    for (const note of notes || []) {
      const minute = String(note.created_at || "").slice(0, 16);
      const key = `${note.title}|${note.message}|${minute}`;
      const current = historyMap.get(key);
      if (current) {
        current.recipientsCount += 1;
      } else {
        historyMap.set(key, {
          id: note.id,
          title: note.title,
          body: note.message,
          sentAt: note.created_at,
          recipientsCount: 1,
        });
      }
    }

    return NextResponse.json({
      deviceTokens: (subscriptions || []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        platform: row.platform || "web",
        createdAt: row.created_at,
      })),
      history: [...historyMap.values()],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { error: authError, status: authStatus } = await requireAdminUser(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const body = await request.json();
    const title = String(body.title || "").trim();
    const message = String(body.message || "").trim();
    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    const { data: subscriptions, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("user_id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const userIds = [...new Set((subscriptions || []).map((row) => row.user_id).filter(Boolean))];
    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        recipientsCount: 0,
        webPush: { attempted: 0, sent: 0, failed: 0 },
        error: "No browser is subscribed yet. Open the app, allow notifications, then send again.",
      });
    }

    const webPush = await sendToMultipleUsers(userIds, {
      title,
      body: message,
      type: "announcement",
      actionUrl: "/notifications",
    });

    return NextResponse.json({
      success: true,
      recipientsCount: userIds.length,
      webPush,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
