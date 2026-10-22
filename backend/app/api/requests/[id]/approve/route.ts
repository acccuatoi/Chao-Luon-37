import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../../../lib/server/auth";
import { approve } from "../../../../../lib/server/store";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(req, "approver");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const result = approve(id, auth.actor);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.code });
  return NextResponse.json(result.request);
}
