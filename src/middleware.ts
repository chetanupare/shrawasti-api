import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error("JWT_SECRET environment variable is not set in middleware!");
}

// Custom JWT payload interface
interface CustomJWTPayload {
  userId: string;
  phone: string;
  role: string;
  iat: number;
  exp: number;
}

// Try to verify as custom JWT first, then fall back to Supabase Auth
async function verifyToken(token: string) {
  // First try: Check if it's our custom JWT (signed with JWT_SECRET)
  try {
    const secret = jwtSecret;
    if (!secret) return null;
    const decoded = jwt.verify(token, secret) as unknown as CustomJWTPayload;
    if (decoded.userId && decoded.role) {
      return {
        type: 'custom-jwt' as const,
        userId: decoded.userId,
        phone: decoded.phone,
        role: decoded.role,
      };
    }
  } catch (e) {
    // Not our custom JWT, try Supabase Auth
  }

  // Second try: Check if it's a Supabase Auth JWT
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
      return {
        type: 'supabase-jwt' as const,
        userId: user.id,
        email: user.email,
      };
    }
  } catch (e) {
    // Not a valid Supabase JWT either
  }

  return null;
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Check if it's the exact service role key (useful for server-to-server or scripts)
    if (token === supabaseServiceRoleKey && supabaseServiceRoleKey.length > 20) {
        return NextResponse.next();
    }

    // Try to verify the token
    const verified = await verifyToken(token);

    if (!verified) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Now verify if user is an admin.
    const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    });

    // For custom JWT, look up user by userId
    const { data: adminUser, error: roleError } = await adminSupabase
      .from('users')
      .select('role')
      .eq('id', verified.userId)
      .single();

    if (roleError || !adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/api/admin/:path*'],
};