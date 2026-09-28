import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // 1. Fetch user profile
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Fetch user's vehicles
    const { data: vehicles } = await supabaseAdmin
      .from("vehicles")
      .select("*")
      .eq("user_id", userId);

    // 3. Fetch user's saved locations
    const { data: locations } = await supabaseAdmin
      .from("saved_locations")
      .select("*")
      .eq("user_id", userId);

    // 4. Fetch user's booking history
    const { data: bookings } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // 5. Fetch user's active subscriptions
    const { data: subscriptions } = await supabaseAdmin
      .from("user_subscriptions")
      .select("*, subscription_plans(*)")
      .eq("user_id", userId);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profile_image,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      vehicles: vehicles || [],
      locations: locations || [],
      bookings: bookings || [],
      subscriptions: subscriptions || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
