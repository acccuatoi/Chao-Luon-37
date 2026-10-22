import { Request, AuditEntry, ApiStatus } from '../types';
import {
  mockGetRequests,
  mockCreateRequest,
  mockApproveRequest,
  mockGetAudit,
  mockGetStatus
} from './mock';

export function isMockMode(): boolean {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_USE_MOCK !== undefined) {
    return process.env.NEXT_PUBLIC_USE_MOCK !== "false";
  }
  return true;
}

// Global provider for dynamic auth headers (set by RoleContext)
type HeaderProvider = () => Promise<Record<string, string>>;
let globalHeaderProvider: HeaderProvider | null = null;

export function setAuthHeaderProvider(provider: HeaderProvider) {
  globalHeaderProvider = provider;
}

async function getHeaders(extra: Record<string, string> = {}): Promise<HeadersInit> {
  let authHeaders: Record<string, string> = {};
  if (globalHeaderProvider) {
    try {
      authHeaders = await globalHeaderProvider();
    } catch (err) {
      console.warn("Could not retrieve auth headers:", err);
    }
  }

  return {
    ...authHeaders,
    ...extra
  };
}

export async function fetchStatus(): Promise<ApiStatus> {
  if (isMockMode()) {
    return mockGetStatus();
  }

  try {
    const headers = await getHeaders();
    const res = await fetch('/api/status', {
      headers,
      cache: 'no-store'
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `HTTP ${res.status}: Backend status error`);
    }
    return await res.json();
  } catch (err: any) {
    console.error("Backend /api/status error:", err);
    throw new Error(err.message || "Backend offline or unreachable (port 3001)");
  }
}

export async function fetchRequests(): Promise<Request[]> {
  if (isMockMode()) {
    return mockGetRequests();
  }

  try {
    const headers = await getHeaders();
    const res = await fetch('/api/requests', {
      headers,
      cache: 'no-store'
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `HTTP ${res.status}: Failed to fetch requests`);
    }
    return await res.json();
  } catch (err: any) {
    console.error("Backend /api/requests error:", err);
    throw new Error(err.message || "Backend offline or unreachable (port 3001)");
  }
}

export async function submitRequest(text: string, requester: string = "", encryptedMemo?: string): Promise<Request> {
  if (isMockMode()) {
    return mockCreateRequest(text, requester);
  }

  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const payload: any = { text };
  if (encryptedMemo) payload.encryptedMemo = encryptedMemo;

  const res = await fetch('/api/requests', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (res.status === 429) {
    throw new Error("Too many requests, try again in a minute (Rate Limit).");
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Failed to submit request (HTTP ${res.status})`);
  }

  return await res.json();
}

export async function approveRequest(id: string, approver: string = ""): Promise<Request> {
  if (isMockMode()) {
    return mockApproveRequest(id, approver);
  }

  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/requests/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    headers
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Approval failed (HTTP ${res.status})`);
  }

  return await res.json();
}

export async function executeDirectly(id: string): Promise<any> {
  if (isMockMode()) {
    throw new Error("Direct execution is not allowed. Execution only happens after quorum approval.");
  }

  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/requests/${encodeURIComponent(id)}/execute`, {
    method: 'POST',
    headers
  });

  const errBody = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(errBody.error || `HTTP ${res.status}: Direct execution rejected`);
  }

  return errBody;
}

export async function fetchAuditLog(): Promise<AuditEntry[]> {
  if (isMockMode()) {
    return mockGetAudit();
  }

  try {
    const headers = await getHeaders();
    const res = await fetch('/api/audit', {
      headers,
      cache: 'no-store'
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `HTTP ${res.status}: Failed to fetch audit log`);
    }
    return await res.json();
  } catch (err: any) {
    console.error("Backend /api/audit error:", err);
    throw new Error(err.message || "Backend offline or unreachable (port 3001)");
  }
}

export type ChainCheck = { ok: boolean; entries: number; brokenAt?: string; headHash: string };

export async function verifyAuditChain(): Promise<ChainCheck> {
  if (isMockMode()) {
    return { ok: true, entries: 8, headHash: "mock-genesis-hash" };
  }

  const headers = await getHeaders();
  const res = await fetch('/api/audit/verify', {
    headers,
    cache: 'no-store'
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Verification failed (HTTP ${res.status})`);
  }

  return await res.json();
}

export async function resetDemoData(): Promise<any> {
  if (isMockMode()) {
    return { ok: true };
  }

  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch('/api/admin/reset', {
    method: 'POST',
    headers
  });

  const errBody = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(errBody.error || `HTTP ${res.status}: Reset failed`);
  }

  return errBody;
}
