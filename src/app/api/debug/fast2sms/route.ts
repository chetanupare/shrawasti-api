import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.FAST2SMS_API_KEY;
  
  return NextResponse.json({
    config: {
      hasApiKey: !!apiKey,
      apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : "NOT SET",
      wabaId: process.env.FAST2SMS_WABA_ID,
      phoneNumberId: process.env.FAST2SMS_PHONE_NUMBER_ID,
      templateId: process.env.FAST2SMS_TEMPLATE_ID,
      senderNumber: process.env.FAST2SMS_SENDER_NUMBER,
    },
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}
