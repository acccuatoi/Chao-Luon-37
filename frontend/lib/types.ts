// Shared data contract. Source of truth: SYNC.md. Add fields only; never rename or remove.
export type Status = "pending" | "approved" | "executed" | "blocked";

export type Proposal = {
  action: string;
  params: Record<string, string | number>;
  reason: string;
  risk: "low" | "medium" | "high";
};

export type Approval = { approver: string; at: string };

export type Request = {
  id: string;
  requester: string;
  text: string;
  proposal: Proposal | null;
  status: Status;
  approvals: Approval[];
  requiredApprovals: number;
  blockedReason?: string;
  createdAt: string;
  encryptedMemo?: string;
};

export type AuditEvent = "proposed" | "approved" | "executed" | "blocked" | "rejected";

export type AuditEntry = {
  id: string;
  at: string;
  actor: string;
  event: AuditEvent;
  requestId: string;
  detail: string;
  prevHash?: string;
  hash?: string;
};

export type ApiStatus = {
  mode: "live" | "simulated";
  agent?: "llm" | "mock";
  policy: { dailyCapUsd: number; whitelist: string[] };
};
