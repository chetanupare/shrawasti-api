import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const body = await request.json();
    const { providerId, status, beforeImages, afterImages, serviceNotes, paymentStatus } = body;

    if (!providerId || !status) {
      return NextResponse.json(
        { error: "providerId and status fields are required" },
        { status: 400 }
      );
    }

    const updates: Record<string, any> = {
      assigned_provider_id: providerId,
      status,
      updated_at: new Date().toISOString(),
    };

    if (paymentStatus) {
      updates.payment_status = paymentStatus;
    }

    if (beforeImages || afterImages || serviceNotes) {
      updates.service_proof = {
        beforeImages: beforeImages || [],
        afterImages: afterImages || [],
        serviceNotes: serviceNotes || "",
        updatedAt: new Date().toISOString(),
      };
    }

    const { data, error } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", bookingId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: data.id,
        status: data.status,
        assignedProviderId: data.assigned_provider_id,
        paymentStatus: data.payment_status,
        serviceProof: data.service_proof,
        updatedAt: data.updated_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
