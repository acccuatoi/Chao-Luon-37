import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../../lib/server/auth";
import { resetAll } from "../../../../lib/server/store";

// Demo helper, OFF unless DEMO_RESET_ENABLED=true. Needs role approver.
export async function POST(req: NextRequest) {
  if (process.env.DEMO_RESET_ENABLED !== "true") {
    return NextResponse.json({ error: "Reset is disabled" }, { status: 403 });
  }
  const auth = await authenticate(req, "approver");
  if ("error" in auth) return auth.error;
  resetAll(auth.actor.name);
  return NextResponse.json({ ok: true });
}
