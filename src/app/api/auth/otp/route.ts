import { NextResponse } from "next/server";
import { generateOTP, storeOTP, sendWhatsAppOTP } from "@/lib/fast2sms";
import { supabaseAdmin } from "@/lib/supabase";

// Rate limiting - use Supabase for persistence across serverless instances
async function isRateLimited(phone: string): Promise<boolean> {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60000);

  const { data, error } = await supabaseAdmin
    .from("otp_rate_limits")
    .select("count, last_attempt")
    .eq("phone", phone)
    .single();

  if (error) {
    // Table might not exist, allow the attempt
    return false;
  }

  const lastAttempt = new Date(data.last_attempt);
  if (lastAttempt < oneMinuteAgo) {
    // Reset count
    await supabaseAdmin
      .from("otp_rate_limits")
      .upsert({
        phone,
        count: 1,
        last_attempt: now.toISOString(),
      });
    return false;
  }

  if (data.count >= 3) {
    return true;
  }

  await supabaseAdmin
    .from("otp_rate_limits")
    .update({
      count: data.count + 1,
      last_attempt: now.toISOString()
    })
    .eq("phone", phone);

  return false;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, channel = "whatsapp" } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Validate Indian phone number
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { error: "Invalid phone number. Please enter a valid 10-digit Indian number." },
        { status: 400 }
      );
    }

    // Rate limiting
    if (await isRateLimited(cleanPhone)) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait 1 minute before trying again." },
        { status: 429 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    await storeOTP(cleanPhone, otp);

    console.log(`[OTP Debug] Generated OTP for ${cleanPhone}`);

    // Send OTP via WhatsApp only
    const result = await sendWhatsAppOTP(cleanPhone, otp);
    console.log(`[OTP Debug] WhatsApp result:`, result);

    if (!result.success) {
      console.error("Failed to send OTP:", result.message);
      return NextResponse.json(
        {
          error: "Failed to send OTP. Please check your Fast2SMS configuration or try again later.",
          details: result.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("OTP send error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send OTP" },
      { status: 500 }
    );
  }
}
