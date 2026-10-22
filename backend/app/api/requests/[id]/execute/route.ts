import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../../../lib/server/auth";
import { log } from "../../../../../lib/server/store";

// There is deliberately no way to execute directly: execution only happens inside approve() after quorum.
// Even a logged-in approver gets 403 here; the attempt is written to the audit log.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authenticate(req, "offline_access");
  const who = "actor" in auth ? auth.actor.name : "anonymous caller";
  log(who, "rejected", id, "Direct execution attempt rejected: execution only happens after quorum approval.");
  return NextResponse.json(
    { error: "Direct execution is not allowed. Execution only happens after quorum approval." },
    { status: 403 },
  );
}
