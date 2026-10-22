import { NextResponse } from "next/server";
import type { ApiStatus } from "../../../types";
import { POLICY } from "../../../lib/server/policy";
import { devBypass } from "../../../lib/server/auth";
import { agentMode } from "../../../lib/agent";
import { APPROVED_ACCOUNTS, bankName } from "../../../lib/server/bank";

export const dynamic = "force-dynamic";

// Public: no secrets here, only what the UI needs to explain the rules.
export async function GET() {
  const body: ApiStatus = {
    mode: devBypass() ? "simulated" : "live",
    agent: agentMode(),
    policy: {
      dailyCapUsd: POLICY.dailyCapUsd,
      whitelist: POLICY.whitelist,
      requiredApprovals: POLICY.requiredApprovals,
      accounts: APPROVED_ACCOUNTS.map((a) => ({ name: a.name, bank: bankName(a.bankBin), accountNumber: a.accountNumber })),
    },
  };
  return NextResponse.json(body);
}
