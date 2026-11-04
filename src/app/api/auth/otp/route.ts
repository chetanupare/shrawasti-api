import { NextResponse } from "next/server";
import { generateOTP, storeOTP, verifyOTP, sendWhatsAppOTP, sendSMOTP } from "@/lib/fast2sms";
import { getFirebaseUuid } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// Rate limiting
const otpAttempts = new Map<string, { count: number; lastAttempt: number }>();

function isRateLimited(phone: string): boolean {
  const now = Date.now();
  const attempt = otpAttempts.get(phone);
  
  if (!attempt || (now - attempt.lastAttempt) > 60000) {
    otpAttempts.set(phone, { count: 1, lastAttempt: now });
    return false;
  }
  
  if (attempt.count >= 3) {
    return true;
  }
  
  otpAttempts.set(phone, { count: attempt.count + 1, lastAttempt: now });
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
    if (isRateLimited(cleanPhone)) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait 1 minute before trying again." },
        { status: 429 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    storeOTP(cleanPhone, otp);

    // Send via WhatsApp first, fallback to SMS
    let result = await sendWhatsAppOTP(cleanPhone, otp);

    if (!result.success) {
      console.log("WhatsApp failed, falling back to SMS:", result.message);
      result = await sendSMOTP(cleanPhone, otp);
    }

    if (!result.success) {
      console.error("Failed to send OTP:", result.message);
      return NextResponse.json(
        { error: "Failed to send OTP. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error: any) {
    console.error("OTP send error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send OTP" },
      { status: 500 }
    );
  }
}
