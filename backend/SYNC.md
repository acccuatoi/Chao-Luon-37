# BACKEND SYNC (Chao-Luon-37)

Owner: Machine 1 (Claude Code + team captain). Only BACKEND edits files in `backend/`.
Requests for FRONTEND live in `frontend/SYNC.md` (section "Requests from BACKEND").

## What this folder is
A separate Next.js 16 app that serves **only the API**, on port **3001**. The UI (`frontend/`) runs on port 3000.

```
backend/
├── app/api/status/route.ts                 GET  public: mode, agent, policy
├── app/api/requests/route.ts               GET  list (any logged-in user) / POST create (role requester)
├── app/api/requests/[id]/approve/route.ts  POST approve (role approver)
├── app/api/requests/[id]/execute/route.ts  POST always 403 (no direct execution)
├── app/api/audit/route.ts                  GET  audit log (any logged-in user)
├── app/api/protected/route.ts              TideCloak sample route (kept for reference)
├── lib/agent/       LLM agent: proposes only; strict schema + action allowlist
├── lib/server/      policy.ts, store.ts (in-memory), auth.ts (TideCloak token check)
├── proxy.ts         CORS for /api/* (origin FRONTEND_ORIGIN, default http://localhost:3000)
├── types.ts         data contract (add-only)
├── tidecloak.json   TideCloak adapter config (public client config, no secrets)
└── init/            TideCloak realm init script
```

## Run
```bash
cd backend
npm install
cp .env.example .env.local   # optional; never commit .env.local
npm run dev                  # http://localhost:3001/api/status
```
TideCloak (Docker, port 8080) must be running for real token checks.

## Behaviour (implemented 12:40)
- `POST /api/requests` body `{ "text": string }` (UTF-8, English or Vietnamese, max 2000 chars). Needs role `requester`.
  The agent turns text into a proposal `{ action: "transfer_funds", params: { amount, currency: "USD", payee }, reason, risk }`.
  - Output that fails the schema or proposes any other action: `proposal: null`, `status: "blocked"`, audit `rejected` + `blocked`.
  - Payee not on whitelist, or rolling 24h cap exceeded (executed + pending in last 24h): `status: "blocked"`, `blockedReason`, audit `blocked`.
  - Otherwise `status: "pending"`, `requiredApprovals: 2` (env `POLICY_REQUIRED_APPROVALS`), audit `proposed`.
  - Response 201 with the `Request`.
- `GET /api/requests`: newest first. `GET /api/audit`: newest first.
- `POST /api/requests/:id/approve`. Needs role `approver`.
  - 404 not found; 400 if not pending (blocked / executed), self-approval, or duplicate approval (the last two are also written to the audit as `rejected`).
  - On reaching `requiredApprovals`: `status: "executed"`, audit `executed`. **The transfer is SIMULATED; no real money moves.**
- `POST /api/requests/:id/execute`: always 403 and audited, to show that nobody can skip the quorum.
- `GET /api/status`: `{ mode, agent, policy: { dailyCapUsd, whitelist } }`.
  - `mode: "live"` = real TideCloak token verification; `"simulated"` = `DEV_AUTH_BYPASS=true`.
  - `agent: "llm"` when `ANTHROPIC_API_KEY` is set, else `"mock"` (offline keyword parser, not AI).
- Errors always come back as `{ "error": string }`.

## Auth
- Every protected call needs `Authorization: Bearer <TideCloak access token>`. Roles checked: `requester`, `approver`; `offline_access` = any logged-in user.
- Identity used in the data = `preferred_username` from the token.
- DEV ONLY: with `DEV_AUTH_BYPASS=true` the API trusts headers `x-dev-user` and `x-dev-role` (comma list) instead of a token, and reports `mode: "simulated"`.

## Honest limits (do not claim otherwise in README / video)
- Quorum is enforced by this API (distinct approvers, no self-approval). It is not yet TideCloak's own Quorum-Enforced signing.
- Storage is in memory and resets on restart.
- Payments are simulated. No E2EE yet.

## Status
- Done: endpoints, agent (mock + LLM path), policy, in-memory store, TideCloak token check, CORS.
- Verified offline earlier (old layout): self-approval, double approval, quorum, whitelist, 24h cap and prompt injection behave as intended. Re-test in this layout: pending.
- Not done: LLM path untested (no API key yet); real-token test with logged-in users; role assignment for team users in TideCloak; TideCloak quorum / E2EE.

## Handoff log
- 12:40 BACKEND: turned `backend/` into a runnable API app on port 3001 (old `backend/api/protected` moved to `backend/app/api/protected`). Contract change (add-only): `ApiStatus.agent?: "llm" | "mock"`. Action name aligned with frontend: `transfer_funds`. Whitelist aligned with frontend mock. Status codes aligned with this file (400 for self/duplicate/not pending).
