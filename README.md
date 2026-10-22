[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

# Chao-Luon-37 | SentinelAgent

## Project overview

_An AI agent that can only propose payments: nothing runs until a TideCloak-authenticated approver other than the requester signs off, every step is checked against policy, and every event lands in a tamper-evident audit log._

Built with [TideCloak](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked).

### 1. Vision & originality
Teams want AI agents to handle payments, but an agent holding an API key is a single point of failure. SentinelAgent splits the power: the agent drafts, people decide.

### 2. Trust constraint insight
The blocker is not the model's skill but its authority. A prompt injection, a hallucination or a stolen key turns an agent with execution rights into an attacker. Today's tools give all-or-nothing access.

### 3. Value & impact
Finance teams can let an agent prepare payments from plain-language requests while keeping control. Even a fully jailbroken agent cannot pay anyone: it has no keys, and its output must match the one allowed action.

### 4. Why TideCloak matters
TideCloak decides who may ask and who may approve (`requester`, `approver` roles) and the backend verifies a TideCloak token on every call. Approvals must come from a different account than the requester. Using TideCloak's own quorum-enforced signing and E2EE is our next step.

### 5. Prototype & storytelling
The demo video shows:
1. **Typed requests.** A payment to an approved bank account waits for approval. Requests without a bank account, or with a prompt injection, are blocked.
2. **QR payments.** An approved QR waits for approval. A QR that says AWS but points to another account is blocked. A QR with instructions hidden in its memo is flagged high risk.
3. **Approval.** A different, approved user releases each payment (simulated) and the requester's remaining daily budget drops.

Also built: refused direct execution (HTTP 403) and a SHA-256 hash-chained audit log.

---

## Demo Video
- Video: [`submission/demo_video/demo.mp4`](submission/demo_video/demo.mp4) (about 2 minutes, no voice-over); plan in [`submission/demo_video/video_script.md`](submission/demo_video/video_script.md)
- Flow: the requester sends typed payment requests, then uploads payment QR codes; the approver reviews and approves them; the requester's open requests and remaining budget update.

---

## Setup

### Prerequisites
- Node.js 18+ and npm.
- Docker (for local TideCloak container on port 8080).

### 1. Start TideCloak (Authentication Server)
```bash
# Start the TideCloak development container on port 8080
docker run -p 8080:8080 --name tidecloak tideorg/tidecloak-dev:latest
```

### 2. Initialize the TideCloak Realm
Provision the initial realm and users once (generates `tidecloak.json`):
```bash
npm run init:backend

# Ensure tidecloak.json is present in both frontend/ and backend/:
# (The init script writes it, or copy backend/tidecloak.json to frontend/tidecloak.json)
```

### 3. Install Monorepo Dependencies
```bash
npm run install:all
```

### 4. (Optional) Configure AI Agent LLM
By default, the system runs with an offline mock keyword parser (`agent: "mock"`). To enable real AI reasoning (`agent: "llm"`), configure `backend/.env.local` (see `backend/.env.example`):
- **Anthropic**: `ANTHROPIC_API_KEY=your_key` and `AGENT_MODEL=claude-haiku-5-5`
- **OpenAI-Compatible (Gemini, Groq, Ollama)**:
  - `LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai`
  - `LLM_API_KEY=your_gemini_api_key`
  - `LLM_MODEL=gemini-3.8-flash` and `LLM_FALLBACK_MODELS=gemini-3.5-flash,gemini-flash-latest` (use model ids your key lists; `backend/check-llm.sh` tests them)

### 5. Run Backend & Frontend

#### Terminal 1: Backend API (Port 3001)
```bash
npm run dev:backend
# API status available at http://localhost:3001/api/status
```

#### Terminal 2: Frontend UI (Port 3000)
For live mode connecting to backend on port 3001, create `frontend/.env.local` with `NEXT_PUBLIC_USE_MOCK=false` (or run with env prefix):
```bash
# Option A: With frontend/.env.local containing NEXT_PUBLIC_USE_MOCK=false
npm run dev:frontend

# Option B: Inline env flag (Linux/macOS / bash)
NEXT_PUBLIC_USE_MOCK=false npm run dev:frontend

# Option C: Offline mock mode (no backend required)
# NEXT_PUBLIC_USE_MOCK=true npm run dev:frontend
```
Open `http://localhost:3000` in your browser.

### 6. Users, roles and demo data
- Give each person a realm role, `requester` or `approver`, and link their Tide account: `bash backend/init/team-users.sh status | roles | link <username> | approve` (run from the repo root; it prints enrollment links, never secrets). Each person signs in from their own browser profile.
- Payments must name a bank account and bank. Only accounts in `POLICY_ACCOUNTS` (`backend/.env.example`, fictional demo accounts) can be paid. Example request: `Pay AWS Cloud Services 1,200 USD to account 0011004455667 at Vietcombank, memo "INV-2026-10"`.
- Demo payment QR codes are in `backend/demo/qr/` (see `backend/demo/README.md`); upload one with "Upload QR image".
- Approver count and daily limit: `POLICY_REQUIRED_APPROVALS`, `POLICY_DAILY_CAP_USD` in `backend/.env.local`.

## Known limitations
- The recorded demo uses **one approver** (`POLICY_REQUIRED_APPROVALS=1`): TideCloak's free plan (5 licences) hit its user limit while we enrolled a third teammate. Set `POLICY_REQUIRED_APPROVALS=2` in `backend/.env.local` for the two-person rule; it is enforced by the backend and covered by our tests.
- Payments are simulated; no money moves.
- DPoP (sender-constrained tokens) is turned off in the frontend; the backend accepts plain Bearer tokens. Enabling DPoP end to end is on the roadmap.
- Approval quorum is enforced by our backend, not yet by TideCloak's quorum-enforced signing; E2EE is not implemented.
- Requests and the audit log are stored in a local JSON file (`backend/.data/db.json`).
- Tide's network returned intermittent 502/503 errors during the event, which slowed user enrolment.
