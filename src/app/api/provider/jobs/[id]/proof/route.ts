import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireProviderUser } from "@/lib/auth";

const BUCKET = "service-proofs";
const MAX_BYTES = 5 * 1024 * 1024;

async function ensureProofBucket() {
  const { data } = await supabaseAdmin.storage.getBucket(BUCKET);
  if (data) return;
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(error.message);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError, status: authStatus, provider } = await requireProviderUser(request);
    if (authError || !provider) {
      return NextResponse.json({ error: authError }, { status: authStatus });
    }

    const { id: bookingId } = await params;
    const body = await request.json();
    const kind = body.kind === "before" || body.kind === "after" ? body.kind : null;
    const raw = typeof body.imageBase64 === "string" ? body.imageBase64 : "";
    const imageBase64 = raw.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");

    if (!kind || !imageBase64) {
      return NextResponse.json({ error: "A before or after photo is required" }, { status: 400 });
    }

    const bytes = Buffer.from(imageBase64, "base64");
    if (bytes.length < 1000 || bytes.length > MAX_BYTES) {
      return NextResponse.json({ error: "Photo must be a real image under 5 MB" }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("id, assigned_provider_id, status")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.assigned_provider_id !== provider.id) {
      return NextResponse.json({ error: "Forbidden: Booking not assigned to you" }, { status: 403 });
    }

    if (!["accepted", "assigned", "arrived", "in_progress"].includes(booking.status)) {
      return NextResponse.json({ error: "Photos can only be added while the job is active" }, { status: 422 });
    }

    await ensureProofBucket();
    const path = `${bookingId}/${kind}-${Date.now()}.jpg`;
    const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET).upload(path, bytes, {
      contentType: "image/jpeg",
      upsert: false,
    });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrl } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    if (!publicUrl?.publicUrl) {
      return NextResponse.json({ error: "Uploaded photo has no public address" }, { status: 500 });
    }

    return NextResponse.json({ url: publicUrl.publicUrl, kind });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
