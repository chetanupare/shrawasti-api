import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("JWT_SECRET environment variable is not set in middleware/auth.ts!");
}

export interface JwtPayload {
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

export function verifyJwtToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
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
