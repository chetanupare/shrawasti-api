import crypto from "crypto";
import { supabaseAdmin } from "./supabase";

// Configuration - read from environment
export const FAST2SMS_CONFIG = {
  API_KEY: process.env.FAST2SMS_API_KEY || "",
  WABA_ID: process.env.FAST2SMS_WABA_ID || "",
  PHONE_NUMBER_ID: process.env.FAST2SMS_PHONE_NUMBER_ID || "",
  TEMPLATE_ID: process.env.FAST2SMS_TEMPLATE_ID || "",
  MESSAGE_ID: process.env.FAST2SMS_MESSAGE_ID || "",
  SENDER_NUMBER: process.env.FAST2SMS_SENDER_NUMBER || "",
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
    // Format phone number - 10-digit Indian number without +91 prefix
    let formattedPhone = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');

    // Ensure exactly 10 digits
    if (formattedPhone.length !== 10) {
      formattedPhone = formattedPhone.replace(/\D/g, '');
      if (formattedPhone.length > 10) {
        formattedPhone = formattedPhone.slice(-10);
      }
    }

    // Debug: Log config being used (redact API key)
    console.log('Fast2SMS Config check:', {
      hasApiKey: !!FAST2SMS_CONFIG.API_KEY,
      apiKeyPrefix: FAST2SMS_CONFIG.API_KEY?.slice(0, 10),
      phoneNumberId: FAST2SMS_CONFIG.PHONE_NUMBER_ID,
      messageId: FAST2SMS_CONFIG.MESSAGE_ID,
      templateId: FAST2SMS_CONFIG.TEMPLATE_ID,
      senderNumber: FAST2SMS_CONFIG.SENDER_NUMBER,
      wabaId: FAST2SMS_CONFIG.WABA_ID,
    });

    // Use Fast2SMS WhatsApp Business API endpoint (GET request)
    const url = new URL('https://www.fast2sms.com/dev/whatsapp');

    // Build query parameters
    // Use MESSAGE_ID (not TEMPLATE_ID) - this is the numeric ID like 41414
    // Template content: {{1}} is your verification code. For your security, do not share this code.
    const messageId = FAST2SMS_CONFIG.MESSAGE_ID;
    url.searchParams.append('message_id', messageId);
    url.searchParams.append('phone_number_id', FAST2SMS_CONFIG.PHONE_NUMBER_ID);
    url.searchParams.append('numbers', formattedPhone);
    // Pass OTP as template variable for {{1}} placeholder
    url.searchParams.append('variables_values', otp);

    console.log('Fast2SMS Request URL:', url.toString().replace(FAST2SMS_CONFIG.API_KEY || '', '[REDACTED]'));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': FAST2SMS_CONFIG.API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('Fast2SMS WhatsApp response:', JSON.stringify(result, null, 2));
    console.log('Fast2SMS Response status:', response.status, response.statusText);

    // Check for successful response
    // Fast2SMS API can return:
    // - { status: true, message: "Message sent successfully" }
    // - { message: "Success", ... } with a 200 status
    // - { return_val: <message_id>, ... } for success
    const isSuccess = result.status === true ||
                       result.message === 'Success' ||
                       (response.ok && (result.return_val || result.message_id || result.message));

    if (isSuccess) {
      return {
        success: true,
        message: 'OTP sent via WhatsApp',
      };
    }

    // Handle error responses
    // Error codes: 413=API disabled, 424=invalid template, 425=template not approved
    const errorMsg = result.message || result.error || 'Failed to send WhatsApp OTP';
    const errorCode = (result as any).error_code || (result as any).code;

    // Provide specific guidance based on error code
    if (errorCode === 413) {
      return {
        success: false,
        message: 'Fast2SMS API access disabled. Contact support. Enable Quick API Access in dashboard.',
      };
    }
    if (errorCode === 424 || errorCode === 425) {
      return {
        success: false,
        message: 'Invalid or unapproved template. Verify template ID and approval status.',
      };
    }
    if (errorCode === 996) {
      return {
        success: false,
        message: 'KYC required. Complete KYC in Fast2SMS account.',
      };
    }

    return {
      success: false,
      message: `${errorMsg} (Code: ${errorCode || 'unknown'})`,
    };
  } catch (error: any) {
    console.error('Fast2SMS WhatsApp error:', error);
    return {
      success: false,
      message: error.message || 'Failed to send WhatsApp OTP',
    };
  }
}

