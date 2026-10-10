import crypto from "crypto";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { queryProviderByPhoneOrId } from "@/lib/db";

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "shrawasti-da98e";

let firebaseCerts: { certs: Record<string, string>; expires: number } | null = null;

async function getFirebaseCerts() {
  if (firebaseCerts && firebaseCerts.expires > Date.now()) return firebaseCerts.certs;
  const res = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
  if (!res.ok) throw new Error("Could not load Firebase signing keys");
  const maxAge = Number((res.headers.get("cache-control") || "").match(/max-age=(\d+)/)?.[1] || 3600);
  const certs = await res.json() as Record<string, string>;
  firebaseCerts = { certs, expires: Date.now() + maxAge * 1000 };
  return certs;
}

async function verifyFirebaseIdToken(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  if (header.alg !== "RS256" || !header.kid) return null;

  const certs = await getFirebaseCerts();
  const cert = certs[header.kid];
  if (!cert) return null;

  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(`${parts[0]}.${parts[1]}`);
  if (!verifier.verify(cert, Buffer.from(parts[2], "base64url"))) return null;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp < now) return null;
  if (payload.aud !== FIREBASE_PROJECT_ID) return null;
  if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) return null;
  if (!payload.sub) return null;
  return payload;
}

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

export async function ensureUserExists(user: any) {
  if (!user || !user.id) return;
  const { supabaseAdmin } = require("@/lib/supabase");
  
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existing) {
    const userPhone = user.phone || user.user_metadata?.phone || null;
    const userName = user.user_metadata?.name || (user.email ? user.email.split("@")[0] : "Customer");
    const userEmail = user.email || null;

    await supabaseAdmin.from("users").upsert({
      id: user.id,
      name: userName,
      email: userEmail,
      phone: userPhone,
      updated_at: new Date().toISOString(),
    });
  }
}

export async function requireAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Missing authentication", status: 401, user: null };
  }
  const token = authHeader.split(" ")[1];

  try {
    const payload = await verifyFirebaseIdToken(token);
    if (payload) {
      const phone = payload.phone_number || payload.phone || null;
      const rawUserId = payload.user_id || payload.sub || "";
      const uuid = getFirebaseUuid(rawUserId);
      return {
        error: null,
        status: 200,
        user: {
          id: uuid || rawUserId,
          raw_uid: rawUserId,
          phone,
          email: payload.email || null,
          user_metadata: {
            phone,
            name: payload.name || null,
          },
        } as any,
      };
    }
  } catch {}

  const payload = parseJwtPayload(token);

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

export function isProviderAccountBlocked(status: string | null | undefined) {
  return ["inactive", "disabled", "suspended", "blocked"].includes(String(status || "active").toLowerCase());
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

  if (isProviderAccountBlocked(provider.status)) {
    return { error: "Forbidden: Provider inactive", status: 403, user: null, provider: null };
  }

  return { error: null, status: 200, user, provider };
}
