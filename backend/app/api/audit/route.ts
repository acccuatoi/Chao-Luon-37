import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../lib/server/auth";
import { listAudit } from "../../../lib/server/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await authenticate(req, "offline_access");
  if ("error" in auth) return auth.error;
  return NextResponse.json(listAudit());
}
