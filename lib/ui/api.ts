import { Request, AuditEntry, ApiStatus } from '../types';
import {
  mockGetRequests,
  mockCreateRequest,
  mockApproveRequest,
  mockGetAudit,
  mockGetStatus
} from './mock';

export function isMockMode(): boolean {
  // Default to true if not explicitly set to "false"
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_USE_MOCK !== undefined) {
    return process.env.NEXT_PUBLIC_USE_MOCK !== "false";
  }
  return true;
}

export async function fetchStatus(): Promise<ApiStatus> {
  if (isMockMode()) {
    return mockGetStatus();
  }

  try {
    const res = await fetch('/api/status', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    // Graceful fallback to mock if backend endpoint is unavailable
    console.warn("Backend /api/status unreachable, falling back to simulated status", err);
    return mockGetStatus();
  }
}

export async function fetchRequests(): Promise<Request[]> {
  if (isMockMode()) {
    return mockGetRequests();
  }

  try {
    const res = await fetch('/api/requests', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend /api/requests unreachable, falling back to mock data", err);
    return mockGetRequests();
  }
}

export async function submitRequest(text: string, requester: string = ""): Promise<Request> {
  if (isMockMode()) {
    return mockCreateRequest(text, requester);
  }

  const res = await fetch('/api/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

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

  const res = await fetch(`/api/requests/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Approval failed (HTTP ${res.status})`);
  }

  return await res.json();
}

export async function fetchAuditLog(): Promise<AuditEntry[]> {
  if (isMockMode()) {
    return mockGetAudit();
  }

  try {
    const res = await fetch('/api/audit', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend /api/audit unreachable, falling back to mock audit log", err);
    return mockGetAudit();
  }
}
