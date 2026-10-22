# FRONTEND SYNC (Chao-Luon-37)

## Overview
This directory contains the complete Next.js (App Router 16.x) + React 19 + TypeScript frontend for **SentinelAgent (Cháo Lươn 37)**.

## Screens & Routes
- **`/` (Submit Request)**:
  - Natural language task prompt box (English & Vietnamese UTF-8).
  - Quick sample chips (AWS invoice, Office rent Hòa Bình, limit breach).
  - Mascot Hero Card: **"Lươn Vệ Binh 37 (Sentinel Eel)"** with character dialogue and cyber security badges.
  - Visual Governance Flow: 4-step progress tracker (`Request -> AI Proposal -> Quorum Approval -> Outcome`).
  - Proposal Card: parameters breakdown, policy violation alerts, risk tag (Low / Medium / High).
- **`/queue` (Approval Queue)**:
  - Real-time approval requests list with quorum progress indicators (e.g. `1/2 Approvals`).
  - Role-gated "Approve Request" button: disabled for self-approval, non-approvers, or duplicate signatures.
  - 5-second automatic polling + manual refresh.
- **`/audit` (Cryptographic Audit Log)**:
  - Immutable chronological ledger of all events (`proposed`, `approved`, `executed`, `blocked`, `rejected`).
  - Filter by event type and search by Request ID.

## User & Role Configuration
- Default Administrator / Approver: `acccuatoi (Quản trị viên)` (Role: `approver`).
- Default Requester: `alice.requester@corp.internal` (Role: `requester`).
- Role toggler in header allows switching roles instantly to test permissions.

## Integration with Backend
- `lib/ui/api.ts` connects to backend endpoints:
  - `POST /api/requests`
  - `GET /api/requests`
  - `POST /api/requests/:id/approve`
  - `GET /api/audit`
  - `GET /api/status`
- When `NEXT_PUBLIC_USE_MOCK=true` (or when backend endpoints are not yet online), the client automatically falls back to the in-memory mock store in `lib/ui/mock.ts`.
- Set `NEXT_PUBLIC_USE_MOCK=false` to switch to live backend with zero code changes.

## Development
```bash
npm install
npm run dev
# App will run on http://localhost:3000
```
