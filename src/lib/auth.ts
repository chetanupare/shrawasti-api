import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { queryProviderByPhoneOrId } from "@/lib/db";

export function getFirebaseUuid(uid: string | null | undefined): string | undefined {
  if (!uid) return undefined;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid)) {
    return uid;
  }
  let hex = '';
  for (let i = 0; i < uid.length; i++) {
    hex += uid.charCodeAt(i).toString(16).padStart(2, '0');
  }
  hex = hex.padEnd(32, '0').slice(0, 32);
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
}

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

  // 1. Try parsing JWT payload (Firebase Auth / custom ID tokens)
  const payload = parseJwtPayload(token);
  if (payload && (payload.sub || payload.user_id || payload.phone_number)) {
    const phone = payload.phone_number || payload.phone || null;
    const rawUserId = payload.user_id || payload.sub || '';
    const uuid = getFirebaseUuid(rawUserId);
    const user = {
      id: uuid || rawUserId,
      raw_uid: rawUserId,
      phone: phone,
      email: payload.email || null,
      user_metadata: {
        phone: phone,
        name: payload.name || null,
      },
    };
    return { error: null, status: 200, user: user as any };
  }

  // 2. Try Supabase Auth token (only if sub looks like a valid UUID)
  if (payload?.sub && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.sub)) {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser(token);
      if (!authError && authData?.user) {
        return { error: null, status: 200, user: authData.user };
      }
    } catch {}
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
  const provider = (await queryProviderByPhoneOrId(user.id)) || (user.raw_uid ? await queryProviderByPhoneOrId(user.raw_uid) : null) || (userPhone ? await queryProviderByPhoneOrId(userPhone) : null);

  if (!provider) {
    return { error: "Forbidden: Provider profile not found", status: 403, user: null, provider: null };
  }

  if (provider.status !== 'active') {
    return { error: "Forbidden: Provider inactive", status: 403, user: null, provider: null };
  }

  return { error: null, status: 200, user, provider };
}
