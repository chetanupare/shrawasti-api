import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tickets: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, subject, message, bookingId, contactEmail, contactPhone } = body;

    if (!userId || !subject || !message) {
      return NextResponse.json(
        { error: "userId, subject, and message are required" },
        { status: 400 }
      );
    }

    const ticketData = {
      user_id: userId,
      subject,
      message,
      booking_id: bookingId || null,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      status: "open",
    };

    const { data, error } = await supabase
      .from("support_tickets")
      .insert(ticketData)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ticket: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
