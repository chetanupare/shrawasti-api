import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from("reviews").select("*").order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const reviews = (data || []).map((r: any) => ({
      id: r.id,
      bookingId: r.booking_id || r.bookingId,
      userId: r.user_id || r.userId,
      providerId: r.provider_id || r.providerId,
      serviceId: r.service_id || r.serviceId,
      rating: Number(r.rating || 5),
      comment: r.comment || "",
      isPublished: r.is_published ?? true,
      createdAt: r.created_at,
    }));

    return NextResponse.json({ reviews });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, isPublished, rating, comment } = body;

    if (!id) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    const updates: any = {};
    if (isPublished !== undefined) updates.is_published = isPublished;
    if (rating !== undefined) updates.rating = parseInt(rating);
    if (comment !== undefined) updates.comment = comment;

    const { data, error } = await supabaseAdmin
      .from("reviews")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, review: data });
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
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("reviews").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
