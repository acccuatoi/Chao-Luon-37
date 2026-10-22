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
├── app/api/audit/verify/route.ts           GET  recompute audit hash chain
├── app/api/admin/reset/route.ts            POST wipe demo data (role approver, only if DEMO_RESET_ENABLED=true)
├── app/api/protected/route.ts              TideCloak sample route (kept for reference)
├── lib/agent/       LLM agent: proposes only; strict schema + action allowlist
├── lib/server/      policy.ts, store.ts (memory + JSON file), auth.ts (TideCloak token check), rateLimit.ts
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
  - `agent: "llm"` when `ANTHROPIC_API_KEY` is set, or `LLM_BASE_URL` + `LLM_MODEL` for an OpenAI-compatible provider (Gemini, Groq, OpenRouter, Ollama); else `"mock"` (offline keyword parser, not AI).
- `POST /api/requests` also accepts optional `encryptedMemo` (string, max 20000): ciphertext made in the browser with TideCloak `doEncrypt`. Stored and returned as is; never decrypted by the backend, never sent to the agent.
- Rate limit: max `RATE_LIMIT_PER_MIN` (default 10) creates per user per minute, else 429.
- Audit log is a **hash chain**: each entry has `prevHash` and `hash = sha256(prevHash + fields)`. `GET /api/audit/verify` returns `{ ok, entries, headHash, brokenAt? }`; any edited, removed or reordered entry gives `ok: false`.
- Data is saved to `backend/.data/db.json` (env `DATA_FILE`, gitignored), so a restart keeps requests and audit. Delete the file or use reset to start clean.
- `POST /api/admin/reset` (role approver) wipes data, only when `DEMO_RESET_ENABLED=true`. For rehearsals.
- Errors always come back as `{ "error": string }`.

## Auth
- Every protected call needs `Authorization: Bearer <TideCloak access token>`. Roles checked: `requester`, `approver`; `offline_access` = any logged-in user.
- Identity used in the data = `preferred_username` from the token.
- DEV ONLY: with `DEV_AUTH_BYPASS=true` the API trusts headers `x-dev-user` and `x-dev-role` (comma list) instead of a token, and reports `mode: "simulated"`.

## Honest limits (do not claim otherwise in README / video)
- Quorum is enforced by this API (distinct approvers, no self-approval). It is not yet TideCloak's own Quorum-Enforced signing.
- Storage is a local JSON file, not a database. The hash chain shows tampering; it does not prevent someone with file access from rewriting the whole file.
- Payments are simulated. E2EE only covers the optional memo, and only once the frontend calls `doEncrypt` and the TideCloak roles for the tag exist (see `frontend/SYNC.md` B20).

## Status
- Done: endpoints, agent (mock + LLM path), policy, store with file persistence, TideCloak token check, CORS, rate limit, hash-chained audit + verify, reset, encrypted memo field.
- 13:15 tested by calling the route handlers directly (dev bypass): 29/29 checks pass (401 without token, roles, self/duplicate approval, quorum 2/2, direct execute 403, whitelist, 24h cap, prompt injection, Vietnamese text, 429, hash chain verify + tamper detection, file persistence + reload, reset rules). `next dev` itself not yet run on the Mac.
- Not done: LLM path untested (no API key yet); real-token test with logged-in users; role assignment for team users in TideCloak; TideCloak quorum / E2EE.

## Handoff log
- 12:40 BACKEND: turned `backend/` into a runnable API app on port 3001 (old `backend/api/protected` moved to `backend/app/api/protected`). Contract change (add-only): `ApiStatus.agent?: "llm" | "mock"`. Action name aligned with frontend: `transfer_funds`. Whitelist aligned with frontend mock. Status codes aligned with this file (400 for self/duplicate/not pending).
- 13:15 BACKEND: added hash-chained audit (`prevHash`, `hash`, `GET /api/audit/verify`), JSON file persistence, per-user rate limit, `POST /api/admin/reset`, optional `encryptedMemo` on requests (add-only contract changes). Execute attempts now record the caller from the token.
- 13:05 BACKEND: agent can also use any OpenAI-compatible API (env `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`), so a free tier or local Ollama works. 20 s timeout on LLM calls.
- 15:20 BACKEND: the rolling 24h cap is now per requester account (each person has their own $5,000 budget); blockedReason wording updated.
- 15:25 BACKEND: visibility per account. GET /api/requests and GET /api/audit return everything only to approvers; other users get only their own requests and the audit entries about them.
- 15:55 BACKEND: if every LLM model fails (503/timeout), the offline parser drafts the proposal and the proposal's note says so (LLM_FALLBACK_TO_MOCK=false to block instead). Per-model timeout 12 s.
- 16:10 BACKEND: payee is re-read from the user's own words (lib/server/payee.ts). A known name followed by other words ("AWS Cloud Services Offshore Ltd") is a different, unapproved payee, even if the model shortened it. Found in testing.
