import { NextRequest, NextResponse } from "next/server";
import { log } from "../../../../../lib/server/store";

// There is deliberately no way to execute directly: execution only happens inside approve() after quorum.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const who = req.headers.get("x-dev-user") ?? "unknown caller";
  log(who, "rejected", id, "Direct execution attempt rejected: execution only happens after quorum approval.");
  return NextResponse.json({ error: "Direct execution is not allowed. Execution only happens after quorum approval." }, { status: 403 });
}
