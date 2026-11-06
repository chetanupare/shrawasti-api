import { NextResponse } from "next/server";
import crypto from "crypto";
import { verifyOTP } from "@/lib/fast2sms";
import { supabaseAdmin } from "@/lib/supabase";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required. Please set it in .env.local");
}

interface UserPayload {
  userId: string;
  phone: string;
  role: string;
  iat: number;
  exp: number;
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

    // Get or create user
    let user = null;
    let isNewUser = false;

    // Try to find user by phone in Supabase
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("phone", cleanPhone)
      .maybeSingle();

    if (existingUser) {
      user = existingUser;
    } else {
      // Create new user
      const uuid = crypto.randomUUID();
      const { data: newUser, error } = await supabaseAdmin
        .from("users")
        .insert({
          id: uuid,
          phone: cleanPhone,
          name: "New User",
          email: null,
          role: "customer",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating user:", error);
        return NextResponse.json(
          { error: "Failed to create user account" },
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
      JWT_SECRET,
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
