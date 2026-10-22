import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../lib/server/auth";
import { createRequest, listRequests } from "../../../lib/server/store";
import { proposeAction } from "../../../lib/agent";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await authenticate(req, "offline_access");
  if ("error" in auth) return auth.error;
  return NextResponse.json(listRequests());
}

export async function POST(req: NextRequest) {
  const auth = await authenticate(req, "requester");
  if ("error" in auth) return auth.error;
  let text = "";
  try {
    const body = (await req.json()) as { text?: unknown };
    text = typeof body.text === "string" ? body.text.normalize("NFC").trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!text || text.length > 2000) {
    return NextResponse.json({ error: "text is required (max 2000 characters)" }, { status: 400 });
  }
  const result = await proposeAction(text);
  return NextResponse.json(createRequest(auth.actor, text, result.proposal, result.rejectedReason), { status: 201 });
}
