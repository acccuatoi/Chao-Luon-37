# BACKEND SYNC (Chao-Luon-37)

## Overview
This directory contains the backend services, TideCloak integration, API route specifications, and agent execution logic for **SentinelAgent (Cháo Lươn 37)**.

## Ownership & Responsibility
- **Owner**: Machine 1 (Claude Code) / Backend engineer.
- **Scope**: TideCloak setup, Docker initialization, agent proposal evaluation, quorum execution, and REST endpoints.

## Required API Endpoints (Contract)
The frontend in `frontend/` expects the following 5 endpoints:

### 1. `POST /api/requests`
- **Body**: `{ "text": string }`
- **Behavior**:
  - Accept natural language prompt in English or Vietnamese UTF-8.
  - Formulate proposal (`action`, `amount`, `currency`, `payee`, `reason`, `risk`).
  - Evaluate policy:
    - Daily spending cap: `$5,000 USD` (or current dynamic cap).
    - Payee whitelist: must be in approved whitelist.
    - If exceeded or off-whitelist: set `status = "blocked"` and populate `blockedReason`.
    - If valid: set `status = "pending"` with `requiredApprovals = 2`.
  - Insert audit entry (`event: "proposed"` or `event: "blocked"`).
- **Response**: `Request` object.

### 2. `GET /api/requests`
- **Behavior**: Return all requests sorted newest first (`Request[]`).

### 3. `POST /api/requests/:id/approve`
- **Behavior**:
  - Identify authenticated user from TideCloak session / token.
  - Enforce Quorum rules:
    - 403 Forbidden if user lacks `approver` role.
    - 400 Bad Request if user is the original requester (no self-approval).
    - 400 Bad Request if user already signed this request (no duplicate approval).
    - 400 Bad Request if request is in `blocked` status.
  - Append approval signature `{ approver, at }`.
  - When `approvals.length >= requiredApprovals`:
    - Trigger execution via TideCloak multi-party quorum.
    - Set `status = "executed"`.
    - Insert audit entry `event: "executed"`.
  - Otherwise, insert audit entry `event: "approved"`.
- **Response**: Updated `Request` object.

### 4. `GET /api/audit`
- **Behavior**: Return chronological audit ledger (`AuditEntry[]`) sorted newest first.

### 5. `GET /api/status`
- **Behavior**: Return system status and policy parameters:
```json
{
  "mode": "live",
  "policy": {
    "dailyCapUsd": 5000,
    "whitelist": [
      "AWS Cloud Services",
      "Cloudflare Inc.",
      "Office Lease Corp",
      "Công ty Bất động sản Hòa Bình",
      "Stripe Payouts",
      "Google Workspace"
    ]
  }
}
```

## Admin Account
- The primary administrator & quorum approver is **`acccuatoi`**.

## TideCloak & Docker Setup
- Script: `init/tcinit.sh`
- Configuration: `tidecloak.json`
- Proxy / Middleware: `proxy.ts`
- Roles required: `approver` (assigned to `acccuatoi`), `requester`.

## Handoff to Frontend
When the above endpoints are implemented and live on port 3000 (or via proxy), update root `SYNC.md` so Frontend can toggle `NEXT_PUBLIC_USE_MOCK=false`.
