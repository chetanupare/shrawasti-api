import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId");
    const bookingId = searchParams.get("bookingId");

    let query = supabase.from("reviews").select("*");

    if (providerId) query = query.eq("provider_id", providerId);
    if (bookingId) query = query.eq("booking_id", bookingId);

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reviews: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, userId, providerId, rating, comment } = body;

    if (!bookingId || !userId || !rating) {
      return NextResponse.json(
        { error: "bookingId, userId, and rating are required" },
        { status: 400 }
      );
    }

    const reviewData = {
      booking_id: bookingId,
      user_id: userId,
      provider_id: providerId || null,
      rating,
      comment: comment || null,
    };

    const { data, error } = await supabase
      .from("reviews")
      .insert(reviewData)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Recalculate provider rating if providerId is present
    if (providerId) {
      try {
        const { data: allReviews } = await supabase
          .from("reviews")
          .select("rating")
          .eq("provider_id", providerId);

        if (allReviews && allReviews.length > 0) {
          const sum = allReviews.reduce((acc, r) => acc + (r.rating || 5), 0);
          const avgRating = parseFloat((sum / allReviews.length).toFixed(1));

          await supabase
            .from("providers")
            .update({ rating: avgRating, updated_at: new Date().toISOString() })
            .eq("id", providerId);
        }
      } catch (err) {
        console.warn("Failed to recalculate provider rating:", err);
      }
    }

    return NextResponse.json({ review: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
