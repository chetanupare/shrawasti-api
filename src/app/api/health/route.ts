import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase.from("services").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        { status: "unhealthy", database: "disconnected", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "unhealthy", error: err.message },
      { status: 500 }
    );
  }
}
