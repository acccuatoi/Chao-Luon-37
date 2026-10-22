import { NextResponse } from "next/server";
import type { ApiStatus } from "../../../types";
import { POLICY } from "../../../lib/server/policy";
import { devBypass } from "../../../lib/server/auth";
import { agentMode } from "../../../lib/agent";

export const dynamic = "force-dynamic";

// Public: no secrets here, only what the UI needs to explain the rules.
export async function GET() {
  const body: ApiStatus = {
    mode: devBypass() ? "simulated" : "live",
    agent: agentMode(),
    policy: { dailyCapUsd: POLICY.dailyCapUsd, whitelist: POLICY.whitelist },
  };
  return NextResponse.json(body);
}
