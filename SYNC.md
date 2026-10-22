# SYNC.md: shared channel between all agents and people

This file is the single place where the team (and every AI agent: Claude Code, Antigravity, ...) tells each other what is done, what is needed, and what changed. If it is not written here or in `lib/types.ts`, the other side does not know it.

## Protocol (read this first, every session)

1. `git pull --rebase origin main` and read this whole file before doing anything.
2. Do your work only in your own folders (see Ownership). Never edit someone else's folder; write a request below instead.
3. Every time you finish ONE thing (a screen, an endpoint, a contract change): update your section, then commit and push right away (`bash sync.sh "message"`). Small and frequent beats big and late.
4. Need something from another side? Add a row to **Requests** with `status: open`. When you see a request addressed to you, do it, then set `status: done` with a one-line note.
5. Never rename or delete a field in the contract. Only add. Record every contract change under **Contract changes**.
6. Commit messages in English. No secrets, keys or passwords anywhere (`.env*` is ignored). Do not push broken builds to `main`.
7. Facts we have not verified go under **Unknown / unverified**, never into the UI copy or README as claims.

Repo: https://github.com/acccuatoi/Chao-Luon-37 (public, default branch `main`). Do not commit secrets.

## Who does what (Ownership)

| Side | Person / agent | Owns | Branch |
|---|---|---|---|
| CORE | team captain + Claude Code | `lib/agent/**`, `lib/tide/**`, TideCloak setup, roles, quorum, E2EE, `docs` | `main` / `core` |
| FRONTEND | frontend person + Antigravity | `app/(ui)/**`, `components/**`, `lib/ui/**` | `frontend` |
| BACKEND | backend person | `app/api/**` (queue, storage, audit log, execute) | `backend` |
| QA / DOCS (TBC) | 4th member | tests, public README (<300 words), demo video | `qa` |

Do not touch: `proxy.ts`, `tidecloak.json`, `init/**`, `.env*`, `package.json` dependencies (open a request instead).

## Product in short

An AI agent that can only PROPOSE sensitive actions (current use case assumption: payments). It never holds keys or the authority to execute. Execution needs approval from several humans (quorum) enforced by TideCloak. The UI must make visible: what the AI proposed, who approved, what was blocked and why.

Deadline: Thu 22 Oct 2026, 18:00 Vietnam time. Feature freeze 16:00. Final push 17:45.

## Contract (source of truth; mock first, backend implements)

Endpoints:
- `POST /api/requests` body `{ text }` returns `Request`
- `GET /api/requests` returns `Request[]`
- `POST /api/requests/:id/approve` returns `Request` (approve as the logged-in approver)
- `GET /api/audit` returns `AuditEntry[]`
- `GET /api/status` returns `{ mode: "live" | "simulated", policy: { dailyCapUsd: number, whitelist: string[] } }`

Types (to be mirrored in `lib/types.ts`):
```ts
type Status = "pending" | "approved" | "executed" | "blocked";
type Proposal = { action: string; params: Record<string, string | number>; reason: string; risk: "low" | "medium" | "high" };
type Approval = { approver: string; at: string };
type Request = { id: string; requester: string; text: string; proposal: Proposal | null; status: Status; approvals: Approval[]; requiredApprovals: number; blockedReason?: string; createdAt: string };
type AuditEntry = { id: string; at: string; actor: string; event: "proposed" | "approved" | "executed" | "blocked" | "rejected"; requestId: string; detail: string };
```
Roles (TideCloak): `requester`, `approver`. A requester cannot approve their own request. A user cannot approve the same request twice.
Policy numbers (cap, whitelist) are placeholders; always read them from `/api/status`, never hard-code.

## Requests board

| # | From | To | Request | Status | Note |
|---|---|---|---|---|---|
| 1 | CORE | FRONTEND | Build 3 screens (submit `/`, approval queue `/queue`, audit log `/audit`) + header with user/role and a status badge from `/api/status`. Use mock data behind `NEXT_PUBLIC_USE_MOCK=true` with a visible "MOCK DATA" banner. Full brief was sent as a prompt; summary in Frontend section. | open | |
| 2 | CORE | BACKEND | Implement the 5 endpoints above with in-memory storage first. Enforce: no self-approval, no double approval, no execution without enough approvals, direct calls to execute are rejected. | open | |
| 3 | CORE | ALL | Confirm the use case (payments with whitelist and daily cap) and the judging criteria. | open | Criteria still UNKNOWN to CORE |
| 4 | FRONTEND | CORE | (add rows here) | | |

## Status by side (update after each finished item)

### CORE (updated 11:10)
- Done: TideCloak dev server (Docker, localhost:8080), realm `nextjs-test`, client `myclient`, first admin enrolled, Next.js scaffold runs on localhost:3000 with Log In page.
- Doing: repo push, roles `requester` / `approver`, connect Raziel MCP, `lib/agent` skeleton.
- Needs from others: frontend and backend please read Requests #1 and #2.
- Next: wire quorum (try Tide scenario `policy-governed-signing`; fallback: role-based approval + E2EE).

### FRONTEND (updated -)
- Done:
- Doing:
- Needs from others:

### BACKEND (updated -)
- Done:
- Doing:
- Needs from others:

### QA / DOCS (updated -)
- Done:
- Doing:

## Contract changes (append only)

- 11:10 initial contract (see above).

## Unknown / unverified (do not present as fact)

- Judging criteria and where to submit: ask the organizer.
- Whether TideCloak quorum can govern arbitrary business actions in our app (to be tested via Raziel).
- Claims such as "4 nodes", "30-second keys", "one-click revocation": not verified; `tidecloak.json` shows `thresholdT: 14, thresholdN: 20`.
- Whether the demo may use a simulated fallback: the UI must always label simulated mode honestly.

## Decisions log (append only)

- 11:10 One repo, Next.js (TideCloak template). One use case for the demo (payments). Others only mentioned in README.
