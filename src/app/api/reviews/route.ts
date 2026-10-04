import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuthenticatedUser, ensureUserExists } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId");
    const bookingId = searchParams.get("bookingId");

    let query = supabaseAdmin.from("reviews").select("*");

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
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || "Authentication required" }, { status: authStatus || 401 });
    }

    await ensureUserExists(user);

    const body = await request.json();
    const { bookingId, providerId: reqProviderId, rating, comment } = body;

    if (!bookingId || !rating) {
      return NextResponse.json(
        { error: "bookingId and rating are required" },
        { status: 400 }
      );
    }

    // Fetch booking details to verify provider and user
    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("assigned_provider_id, user_id")
      .eq("id", bookingId)
      .maybeSingle();

    const providerId = reqProviderId || booking?.assigned_provider_id || null;

    const reviewData = {
      booking_id: bookingId,
      user_id: user.id,
      provider_id: providerId,
      rating,
      comment: comment || null,
    };

    const { data: savedReview, error: insertError } = await supabaseAdmin
      .from("reviews")
      .insert(reviewData)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Recalculate provider average rating
    if (providerId) {
      const { data: providerReviews } = await supabaseAdmin
        .from("reviews")
        .select("rating")
        .eq("provider_id", providerId);

      if (providerReviews && providerReviews.length > 0) {
        const avg = Number(
          (providerReviews.reduce((sum, r) => sum + Number(r.rating), 0) / providerReviews.length).toFixed(1)
        );
        await supabaseAdmin
          .from("providers")
          .update({ rating: avg })
          .eq("id", providerId);
      }
    }

    return NextResponse.json({ review: savedReview }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
