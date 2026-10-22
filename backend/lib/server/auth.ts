import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyTideCloakToken } from "@tidecloak/nextjs/server";
import tcConfig from "../../tidecloak.json";

export type Actor = { id: string; name: string };
export type AuthResult = { actor: Actor } | { error: NextResponse };

// DEV ONLY: test the API without TideCloak tokens (headers x-dev-user / x-dev-role). Defaults to OFF.
// When ON, /api/status reports mode "simulated" so the UI never claims "live".
export const devBypass = () => process.env.DEV_AUTH_BYPASS === "true";

const fail = (status: number, error: string) => ({ error: NextResponse.json({ error }, { status }) });

/** Verifies the Bearer token with TideCloak and requires `role` ("requester", "approver" or "offline_access"). */
export async function authenticate(req: NextRequest, role: string): Promise<AuthResult> {
  if (devBypass()) {
    const user = req.headers.get("x-dev-user");
    const roles = (req.headers.get("x-dev-role") ?? "").split(",").map((s) => s.trim());
    if (!user) return fail(401, "Unauthorized: missing x-dev-user (dev bypass)");
    if (role !== "offline_access" && !roles.includes(role)) return fail(403, `Forbidden: role "${role}" required`);
    return { actor: { id: `dev:${user}`, name: user } };
  }
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return fail(401, "Unauthorized: missing token");
  try {
    const user = (await verifyTideCloakToken(tcConfig as any, header.slice(7), [role])) as Record<string, any> | null;
    if (!user) return fail(403, `Forbidden: role "${role}" required`);
    const id = String(user.vuid ?? user.sub ?? user.tideuserkey ?? "unknown");
    const name = String(user.preferred_username ?? user.name ?? user.email ?? id);
    return { actor: { id, name } };
  } catch (e) {
    console.error("Token verification failed:", e);
    return fail(401, "Unauthorized: token verification failed");
  }
}
