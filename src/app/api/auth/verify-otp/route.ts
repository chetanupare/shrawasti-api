import { NextResponse } from "next/server";
import { verifyOTP } from "@/lib/fast2sms";
import { supabaseAdmin } from "@/lib/supabase";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("JWT_SECRET environment variable is not set!");
}

interface UserPayload {
  userId: string;
  phone: string;
  role: string;
  iat: number;
  exp: number;
}

function getJwtSecret(): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return JWT_SECRET;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, otp } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { error: "Phone number and OTP are required" },
        { status: 400 }
      );
    }

    // Validate phone
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    // Verify OTP
    const isValid = await verifyOTP(cleanPhone, otp);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Get or create user in Supabase
    // First, check if user profile exists in public.users table
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("phone", cleanPhone)
      .maybeSingle();

    let user: any;
    let isNewUser = false;

    if (existingProfile) {
      // User profile exists, update it
      user = existingProfile;
      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({ updated_at: new Date().toISOString() })
        .eq("phone", cleanPhone);

      if (updateError) {
        console.error("Error updating user profile:", updateError);
      }
    } else {
      // Create new user profile
      // Generate a proper UUID v4
      const uuid = randomUUID();
      const { data: newUser, error } = await supabaseAdmin
        .from("users")
        .insert({
          id: uuid,
          phone: cleanPhone,
          name: "New User",
          email: null,
          role: "customer",
          profile_image: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating user:", error);
        return NextResponse.json(
          { error: `Failed to create user account: ${error.message}` },
          { status: 500 }
        );
      }
      user = newUser;
      isNewUser = true;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
        role: user.role || "customer",
      } as UserPayload,
      getJwtSecret(),
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      success: true,
      token,
      isNewUser,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profile_image,
      },
    });
  } catch (error: any) {
    console.error("OTP verify error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify OTP" },
      { status: 500 }
    );
  }
}