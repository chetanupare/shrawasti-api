import crypto from "crypto";

// Configuration - read from environment
export const FAST2SMS_CONFIG = {
  API_KEY: process.env.FAST2SMS_API_KEY || "",
  WABA_ID: process.env.FAST2SMS_WABA_ID || "1593792026096959",
  PHONE_NUMBER_ID: process.env.FAST2SMS_PHONE_NUMBER_ID || "1341820212357676",
  TEMPLATE_ID: process.env.FAST2SMS_TEMPLATE_ID || "2228535738070252",
  SENDER_NUMBER: process.env.FAST2SMS_SENDER_NUMBER || "+919168143290",
};

// OTP storage (in production, use Redis)
export const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTP with expiry and auto-cleanup
export function storeOTP(phone: string, otp: string, ttlMinutes = 5): void {
  const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
  otpStore.set(phone, { otp, expiresAt });

  // Auto-cleanup after TTL
  setTimeout(() => {
    const entry = otpStore.get(phone);
    if (entry && entry.expiresAt <= Date.now()) {
      otpStore.delete(phone);
    }
  }, ttlMinutes * 60 * 1000);
}

// Verify stored OTP
export function verifyOTP(phone: string, otp: string): boolean {
  const entry = otpStore.get(phone);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    return false;
  }
  if (entry.otp !== otp) return false;
  otpStore.delete(phone);
  return true;
}

// Fast2SMS WhatsApp API
export async function sendWhatsAppOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; message: string }> {
  try {
    // Format phone number - Fast2SMS expects without +91 prefix or with country code
    let formattedPhone = phoneNumber.replace(/[^0-9]/g, "");
    if (formattedPhone.startsWith("91")) {
      formattedPhone = formattedPhone.substring(2);
    }
    if (!formattedPhone.startsWith("91")) {
      formattedPhone = "91" + formattedPhone;
    }

    const url = "https://www.fast2sms.com/dev/api/whatsapp-v2";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "authorization": FAST2SMS_CONFIG.API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FAST2SMS_CONFIG.WABA_ID,
        to: formattedPhone,
        type: "template",
        template: {
          name: "otp",
          language: { code: "en" },
          component_type: "body",
          parameters: [
            { type: "text", text: otp }
          ],
        },
        messaging_product: "whatsapp",
      }),
    });

    const result = await response.json();
    return {
      success: response.ok,
      message: result.message || result.error || "OTP sent",
    };
  } catch (error: any) {
    console.error("Fast2SMS error:", error);
    return {
      success: false,
      message: error.message || "Failed to send OTP",
    };
  }
}

// Fallback to SMS if WhatsApp fails
export async function sendSMOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; message: string }> {
  try {
    let formattedPhone = phoneNumber.replace(/[^0-9]/g, "");
    if (!formattedPhone.startsWith("91")) {
      formattedPhone = "91" + formattedPhone;
    }

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
    return {
      success: response.ok && result.return && result.return === true,
      message: result.message || result.return?.msg || "OTP sent",
    };
  } catch (error: any) {
    console.error("Fast2SMS SMS error:", error);
    return {
      success: false,
      message: error.message || "Failed to send OTP",
    };
  }
}