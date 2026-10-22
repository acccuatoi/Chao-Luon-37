import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../lib/server/auth";
import { createRequest, listRequests } from "../../../lib/server/store";
import { allow } from "../../../lib/server/rateLimit";
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
  if (!allow(auth.actor.id)) {
    return NextResponse.json({ error: "Too many requests, try again in a minute" }, { status: 429 });
  }
  let text = "";
  let encryptedMemo: string | undefined;
  try {
    const body = (await req.json()) as { text?: unknown; encryptedMemo?: unknown };
    text = typeof body.text === "string" ? body.text.normalize("NFC").trim() : "";
    if (body.encryptedMemo !== undefined) {
      if (typeof body.encryptedMemo !== "string" || body.encryptedMemo.length > 20000) {
        return NextResponse.json({ error: "encryptedMemo must be a string (max 20000 characters)" }, { status: 400 });
      }
      encryptedMemo = body.encryptedMemo || undefined;
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!text || text.length > 2000) {
    return NextResponse.json({ error: "text is required (max 2000 characters)" }, { status: 400 });
  }
  // Only `text` goes to the agent. The encrypted memo is stored as opaque ciphertext and never decrypted here.
  const result = await proposeAction(text);
  return NextResponse.json(createRequest(auth.actor, text, result.proposal, result.rejectedReason, encryptedMemo), {
    status: 201,
  });
}
