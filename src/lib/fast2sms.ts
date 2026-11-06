import crypto from "crypto";
import { supabaseAdmin } from "./supabase";

// Configuration - read from environment
export const FAST2SMS_CONFIG = {
  API_KEY: process.env.FAST2SMS_API_KEY || "",
  WABA_ID: process.env.FAST2SMS_WABA_ID || "1593792026096959",
  PHONE_NUMBER_ID: process.env.FAST2SMS_PHONE_NUMBER_ID || "1341820212357676",
  TEMPLATE_ID: process.env.FAST2SMS_TEMPLATE_ID || "2228535738070252",
  MESSAGE_ID: process.env.FAST2SMS_MESSAGE_ID || "41414",
  SENDER_NUMBER: process.env.FAST2SMS_SENDER_NUMBER || "+919168143290",
};

// Generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTP in Supabase (works across serverless instances)
export async function storeOTP(phone: string, otp: string, ttlMinutes = 5): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

  const { error } = await supabaseAdmin
    .from("otp_codes")
    .upsert({
      phone,
      otp,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    }, { onConflict: "phone" });

  if (error) {
    console.error("Error storing OTP:", error);
    throw new Error("Failed to store OTP");
  }
}

// Verify stored OTP from Supabase
export async function verifyOTP(phone: string, otp: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("otp_codes")
    .select("otp, expires_at")
    .eq("phone", phone)
    .single();

  if (error || !data) {
    return false;
  }

  const expiresAt = new Date(data.expires_at).getTime();
  if (Date.now() > expiresAt) {
    // Clean up expired OTP
    await supabaseAdmin.from("otp_codes").delete().eq("phone", phone);
    return false;
  }

  if (data.otp !== otp) {
    return false;
  }

  // Delete OTP after successful verification
  await supabaseAdmin.from("otp_codes").delete().eq("phone", phone);
  return true;
}

// Fast2SMS WhatsApp API - using template-based messaging
export async function sendWhatsAppOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; message: string }> {
  try {
    // Format phone number - ensure 10-digit format
    let formattedPhone = phoneNumber.replace(/[^0-9]/g, "");
    if (formattedPhone.length === 10 && !formattedPhone.startsWith("91")) {
      // Keep as 10-digit, Fast2SMS handles it
    }

    const url = "https://www.fast2sms.com/dev/whatsapp";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "authorization": FAST2SMS_CONFIG.API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "whatsapp",
        message_id: FAST2SMS_CONFIG.MESSAGE_ID,
        template_id: FAST2SMS_CONFIG.TEMPLATE_ID,
        numbers: [formattedPhone],
        variables: {
          otp: otp
        }
      }),
    });

    const result = await response.json();
    console.log("Fast2SMS WhatsApp response:", result);
    
    return {
      success: result.return === true,
      message: result.message ? (Array.isArray(result.message) ? result.message[0] : result.message) : (result.return ? "OTP sent via WhatsApp" : "Failed to send WhatsApp OTP"),
    };
  } catch (error: any) {
    console.error("Fast2SMS WhatsApp error:", error);
    return {
      success: false,
      message: error.message || "Failed to send WhatsApp OTP",
    };
  }
}

// Fallback to SMS
export async function sendSMOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; message: string }> {
  try {
    let formattedPhone = phoneNumber.replace(/[^0-9]/g, "");
    if (!formattedPhone.startsWith("91")) {
      formattedPhone = "91" + formattedPhone;
    }

    // Fast2SMS SMS API endpoint
    const url = "https://www.fast2sms.com/dev/bulkV2";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "authorization": FAST2SMS_CONFIG.API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",
        sender_id: "SHRAWAS",
        message: `Your Shrawasti verification code is ${otp}. Valid for 5 minutes.`,
        language: "english",
        flash: 0,
        numbers: formattedPhone,
      }),
    });

    const result = await response.json();
    console.log("Fast2SMS SMS response:", result);
    
    return {
      success: response.ok && result.return && result.return === true,
      message: result.message || result.return?.msg || "OTP sent via SMS",
    };
  } catch (error: any) {
    console.error("Fast2SMS SMS error:", error);
    return {
      success: false,
      message: error.message || "Failed to send SMS",
    };
  }
}