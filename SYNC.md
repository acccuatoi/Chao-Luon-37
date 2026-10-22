# SYNC.md: Master Communication Hub (Chao-Luon-37)

This file is the single master coordination channel between all machines, agents (Claude Code on Machine 1, Antigravity on Machine 2), and team members.

## Project Structure (Monorepo)
The codebase is partitioned into two dedicated directories, each with its own specific `SYNC.md`:

```
Chao-Luon-37/
├── frontend/               <-- Next.js UI application (See frontend/SYNC.md)
│   ├── app/                (Pages: Submit /, Queue /queue, Audit /audit)
│   ├── components/         (Header, VisualFlow, ProposalCard, RoleContext, Mascot)
│   ├── lib/ui/             (API client & Mock data)
│   ├── public/             (Anime brown eel mascot, static assets)
│   ├── SYNC.md             (Frontend-specific status, screens, mock mode)
│   ├── package.json
│   ├── next.config.js
│   └── tsconfig.json
│
├── backend/                <-- Backend services, TideCloak & API specifications (See backend/SYNC.md)
│   ├── api/                (API route handlers)
│   ├── init/               (TideCloak initialization scripts)
│   ├── proxy.ts            (TideCloak proxy / auth middleware)
│   ├── tidecloak.json      (TideCloak realm & client configuration)
│   ├── types.ts            (Data contract)
│   └── SYNC.md             (Backend endpoints, quorum execution, Docker instructions)
│
├── README.md               <-- Project overview
├── SYNC.md                 <-- Master synchronization hub
└── AGENTS.md               <-- Agent operating rules
```

## Detailed Domain Syncs
- **Frontend Details**: See [frontend/SYNC.md](frontend/SYNC.md) for full screen documentation, mock mode details, and UI components.
- **Backend Details**: See [backend/SYNC.md](backend/SYNC.md) for endpoint requirements, quorum authorization logic, and TideCloak setup.

## Shared Data Contract (Source of Truth)
```ts
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
```

## Admin Account
- The primary administrator & quorum approver is configured as **`acccuatoi (Quản trị viên)`**.

## Requests Board

| # | From | To | Request | Status | Note |
|---|---|---|---|---|---|
| 1 | CORE | FRONTEND | Build 3 screens (submit `/`, approval queue `/queue`, audit log `/audit`) + header with user/role and a status badge from `/api/status`. Use mock data behind `NEXT_PUBLIC_USE_MOCK=true` with a visible "MOCK DATA" banner. | done | Built in `frontend/` with 0 errors, browser verified |
| 2 | CORE | BACKEND | Implement the 5 endpoints (`/api/requests`, `/api/requests/:id/approve`, `/api/audit`, `/api/status`) per `backend/SYNC.md`. | done | Backend in `backend/`, port 3001, see `backend/SYNC.md` |
| 3 | FRONTEND | BACKEND | Technical specifications for backend endpoints: support UTF-8 Vietnamese text, enforce quorum (no self/double approval), return live policy from `/api/status`. | done | Implemented & verified with 22/22 checks passing |
| 4 | ALL | ALL | Restructure repository into `frontend/` and `backend/` directories, each with its own `SYNC.md`. | done | Completed & pushed |
| 5 | BACKEND | FRONTEND | UI requirements B1-B18 and Housekeeping H1-H8 to connect frontend to backend. | done | Full live integration, rewrites, token injection, bypass demo |

## Handoff Log

### 11:35 CORE to FRONTEND (Machine 1, Claude)
- Pushed foundation to `main`. `lib/types.ts` created.

### 11:55 FRONTEND to CORE & BACKEND (Machine 2, Antigravity)
- Completed Request #1: 3 screens + Header + Mock client on branch `frontend`. Zero TypeScript errors.

### 12:05 FRONTEND to CORE & BACKEND (Machine 2, Antigravity)
- Added Anime Brown Eel mascot ("Lươn Vệ Binh 37 / Sentinel Eel") to Header, Hero Card, and Visual Flow Step 2.

### 12:20 FRONTEND to CORE & BACKEND (Machine 2, Antigravity)
- Reorganized repository into dedicated `frontend/` and `backend/` directories per user requirement:
  - `frontend/`: Contains complete Next.js UI application and `frontend/SYNC.md`.
  - `backend/`: Contains API handlers, TideCloak config, Docker init scripts, and `backend/SYNC.md`.
- Updated default administrator / approver to `acccuatoi (Quản trị viên)`.
- Both `frontend` and `main` branches synchronized and pushed to GitHub.

### 13:00 FRONTEND to CORE & BACKEND (Machine 2, Antigravity)
- Fulfilled UI requirements B1-B18 and Housekeeping H1-H8:
  - Added Next.js rewrites in `frontend/next.config.js` to proxy `/api/*` to backend on port 3001.
  - Implemented token injection: `Authorization: Bearer <token>` on all requests, with `x-dev-user` & `x-dev-role` for dev bypass.
  - Implemented multi-role detection (checking both realm and client roles `hasRealmRole || hasClientRole`).
  - Added honest wording across UI ("Executed after quorum approvals (simulated payment)").
  - Handled `proposal: null` gracefully with prominent security defense win banner.
  - Added 5 demo script quick chips on submit page.
  - Added "Try direct execution (Demo)" button on pending requests in queue, confirming 403 prevention and audit logging.
  - Updated root `package.json` with monorepo scripts (`dev:frontend`, `dev:backend`, `install:all`).
  - Added `agent?: "llm" | "mock"` to data contract and header badge.

### 13:25 FRONTEND to CORE & BACKEND (Machine 2, Antigravity)
- Addressed follow-ups F1-F4:
  - Updated `README.md` Docker command with correct image (`tideorg/tidecloak-dev:latest`) and realm provisioning instructions (`npm run init:backend`).
  - Aligned one-sentence description in `README.md` and `pitch_overview_draft.md` to honest proposal-only and 2-approver quorum architecture.
  - Added `frontend/.env.example` and clarified in `README.md` how to set `NEXT_PUBLIC_USE_MOCK=false` inside `frontend/.env.local`.
  - Documented OpenAI-compatible LLM provider options (Gemini, Groq, Ollama) and Anthropic in `README.md`.


