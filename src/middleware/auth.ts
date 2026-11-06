import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET environment variable is not set. Token verification will fail.");
}

export interface JwtPayload {
  userId: string;
  phone: string;
  role: string;
  iat: number;
  exp: number;
}

export function verifyJwtToken(token: string): JwtPayload | null {
  if (!JWT_SECRET) {
    console.error("JWT_SECRET not configured");
    return null;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

export async function requireAuth(request: Request) {
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Missing or invalid authorization header", status: 401, user: null };
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyJwtToken(token);

  if (!decoded) {
    return { error: "Invalid or expired token", status: 401, user: null };
  }

  return { error: null, status: 200, user: decoded };
}

export async function requireAdmin(request: Request) {
  const { error, status, user } = await requireAuth(request);
  
  if (error || !user) {
    return { error, status, user: null };
  }

  // Check if user is admin
  const { supabaseAdmin } = require("@/lib/supabase");
  const { data, error: dbError } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", user.userId)
    .single();

  if (dbError || !data || data.role !== "admin") {
    return { error: "Forbidden: Admin access required", status: 403, user: null };
  }

  return { error: null, status: 200, user };
}
