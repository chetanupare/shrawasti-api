const ALLOWED = new Set([
  "http://localhost:3000",
  "https://shrawasti-car-care.vercel.app",
  "https://shrawasti-car-care-git-main.vercel.app",
  "https://shrawasti-pwa.vercel.app",
]);

export function allowedOrigin(origin: string | null): string | null {
  if (!origin) return null;
  if (ALLOWED.has(origin)) return origin;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return origin;
  if (/^https:\/\/shrawasti-pwa(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin)) return origin;
  if (/^https:\/\/shrawasti-car-care(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin)) return origin;
  return null;
}

export function corsHeaders(origin: string | null): Record<string, string> {
  const allow = allowedOrigin(origin);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,DELETE,PATCH,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
    Vary: "Origin",
  };
  if (allow) {
    headers["Access-Control-Allow-Origin"] = allow;
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  return headers;
}
