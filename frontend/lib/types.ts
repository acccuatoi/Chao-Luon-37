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
  // Set on a pending request when paying it now would exceed the requester's daily limit. Added 16:15.
  overLimit?: string;
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
  policy: {
    dailyCapUsd: number;
    whitelist: string[];
    requiredApprovals?: number;
    // Approved bank accounts (added 16:30): when a request names an account, only these can be paid.
    accounts?: { name: string; bank: string; accountNumber: string }[];
  };
};
