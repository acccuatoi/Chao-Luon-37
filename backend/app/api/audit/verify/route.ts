import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../../lib/server/auth";
import { verifyAudit } from "../../../../lib/server/store";

export const dynamic = "force-dynamic";

// Recomputes the audit hash chain. ok=false means an entry was edited, removed or reordered.
export async function GET(req: NextRequest) {
  const auth = await authenticate(req, "offline_access");
  if ("error" in auth) return auth.error;
  return NextResponse.json(verifyAudit());
}
