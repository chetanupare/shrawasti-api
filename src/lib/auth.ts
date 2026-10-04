import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function parseJwtPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const paddedBase64 = pad ? base64 + '='.repeat(4 - pad) : base64;
    const jsonPayload = Buffer.from(paddedBase64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export async function requireAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Missing authentication", status: 401, user: null };
  }
  const token = authHeader.split(" ")[1];

  // 1. Try Supabase Auth token
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (!authError && authData?.user) {
    return { error: null, status: 200, user: authData.user };
  }

  // 2. Fallback: Parse JWT payload (for Firebase Auth ID tokens)
  const payload = parseJwtPayload(token);
  if (payload && (payload.sub || payload.user_id || payload.phone_number)) {
    const phone = payload.phone_number || payload.phone || null;
    const userId = payload.user_id || payload.sub;
    const user = {
      id: userId,
      phone: phone,
      email: payload.email || null,
      user_metadata: {
        phone: phone,
        name: payload.name || null,
      },
    };
    return { error: null, status: 200, user: user as any };
  }

  return { error: "Invalid authentication", status: 401, user: null };
}

export async function requireAdminUser(request: Request) {
  const { error, status, user } = await requireAuthenticatedUser(request);
  if (error || !user) {
    return { error, status, user: null };
  }

  const { data, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !data || data.role !== "admin") {
    return { error: "Forbidden: Admin access required", status: 403, user: null };
  }

  return { error: null, status: 200, user };
}

export async function requireProviderUser(request: Request) {
  const { error, status, user } = await requireAuthenticatedUser(request);
  if (error || !user) {
    return { error, status, user: null, provider: null };
  }

  const userPhone = user.phone || user.user_metadata?.phone || '';
  const phoneClean = userPhone ? userPhone.replace(/\D/g, '') : '';
  const userIsUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);

  let query = supabase.from("providers").select("id, status");

  if (userIsUuid) {
    query = query.eq("id", user.id);
  } else if (phoneClean.length >= 10) {
    const p1 = `+91 ${phoneClean.slice(-10).replace(/(\d{5})(\d{5})/, '$1 $2')}`;
    const p2 = `+91${phoneClean.slice(-10)}`;
    const p3 = phoneClean.slice(-10);
    query = query.or(`phone.eq."${p1}",phone.eq."${p2}",phone.eq."${p3}"`);
  } else {
    return { error: "Forbidden: Provider profile not found", status: 403, user: null, provider: null };
  }

  const { data, error: profileError } = await query.maybeSingle();

  if (profileError || !data) {
    return { error: "Forbidden: Provider profile not found", status: 403, user: null, provider: null };
  }

  if (data.status !== 'active') {
    return { error: "Forbidden: Provider inactive", status: 403, user: null, provider: null };
  }

  return { error: null, status: 200, user, provider: data };
}
