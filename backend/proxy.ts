// CORS for /api/* so the frontend (port 3000) can call this API (port 3001) directly.
// Authorization itself is NOT done here: every route verifies the TideCloak token and role on its own.
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

function withCors(res: NextResponse): NextResponse {
  res.headers.set("Access-Control-Allow-Origin", ORIGIN);
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type, DPoP, x-dev-user, x-dev-role");
  res.headers.set("Vary", "Origin");
  return res;
}

export function proxy(req: NextRequest) {
  if (req.method === "OPTIONS") return withCors(new NextResponse(null, { status: 204 }));
  return withCors(NextResponse.next());
}

export const config = { matcher: ["/api/:path*"] };
