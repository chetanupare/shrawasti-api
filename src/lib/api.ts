import { supabase } from "./supabase";

export async function authFetch(url: string, options: RequestInit = {}) {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("No active session");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${session.access_token}`);

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (res.status === 403) {
    throw new Error("Forbidden: Admin access required");
  }

  return res;
}
