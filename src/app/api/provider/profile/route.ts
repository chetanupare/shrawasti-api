import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuthenticatedUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId") || searchParams.get("phone");

    if (!providerId) {
      return NextResponse.json({ error: "providerId or phone parameter is required" }, { status: 400 });
    }

    const authPhone = user.phone || user.user_metadata?.phone || "";
    const cleanAuthPhone = authPhone.replace(/\D/g, "");
    const cleanReqId = providerId.replace(/\D/g, "");

    const isAuthorized =
      providerId === user.id ||
      cleanReqId.length >= 10 ||
      (cleanAuthPhone && cleanReqId && cleanAuthPhone.endsWith(cleanReqId.slice(-10)));

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden: Cannot access other provider profiles" }, { status: 403 });
    }

    const userPhone = user?.phone || user?.user_metadata?.phone || providerId;
    const cleanPhone = userPhone ? userPhone.replace(/\D/g, '') : '';
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providerId);

    let query = supabase.from("providers").select("*");
    if (cleanPhone.length >= 10) {
      const p1 = `+91 ${cleanPhone.slice(-10).replace(/(\d{5})(\d{5})/, '$1 $2')}`;
      const p2 = `+91${cleanPhone.slice(-10)}`;
      if (isUuid) {
        query = query.or(`id.eq.${providerId},phone.eq."${p1}",phone.eq."${p2}",phone.eq."${providerId}"`);
      } else {
        query = query.or(`phone.eq."${p1}",phone.eq."${p2}",phone.eq."${providerId}"`);
      }
    } else if (isUuid) {
      query = query.eq("id", providerId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    return NextResponse.json({
      provider: {
        id: data.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        profileImage: data.profile_image,
        rating: data.rating || 5.0,
        totalJobs: data.total_jobs || 0,
        isOnline: data.is_online ?? true,
        status: data.status || "active",
        currentLat: data.current_lat,
        currentLng: data.current_lng,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { error: authError, status: authStatus, user } = await requireAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const body = await request.json();
    const { id, name, phone, email, profileImage, isOnline } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "id and name are required" }, { status: 400 });
    }

    if (id !== user.id) {
      return NextResponse.json({ error: "Forbidden: Cannot modify other provider profiles" }, { status: 403 });
    }

    const providerData = {
      id,
      name,
      phone: phone || null,
      email: email || null,
      profile_image: profileImage || null,
      is_online: isOnline ?? true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("providers")
      .upsert(providerData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      provider: {
        id: data.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        profileImage: data.profile_image,
        rating: data.rating,
        totalJobs: data.total_jobs,
        isOnline: data.is_online,
        status: data.status,
        updatedAt: data.updated_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
