[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

# Chao-Luon-37 | SentinelAgent

## Project overview

_An AI agent that can only propose payments: nothing runs until two different TideCloak-authenticated people approve, every step is checked against policy, and every event lands in a tamper-evident audit log._

Built with [TideCloak](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked).

### 1. Vision & originality
Teams want AI agents to handle payments, but an agent holding an API key is a single point of failure. SentinelAgent splits the power: the agent drafts, people decide.

### 2. Trust constraint insight
The blocker is not the model's skill but its authority. A prompt injection, a hallucination or a stolen key turns an agent with execution rights into an attacker. Today's tools give all-or-nothing access.

### 3. Value & impact
Finance teams can let an agent prepare payments from plain-language requests while keeping control. Even a fully jailbroken agent cannot pay anyone: it has no keys, and its output must match the one allowed action.

### 4. Why TideCloak matters
TideCloak decides who may ask and who may approve (`requester`, `approver` roles) and the backend verifies a TideCloak token on every call. Approvals must come from two distinct accounts, never the requester. Using TideCloak's own quorum-enforced signing and E2EE is our next step.

### 5. Prototype & storytelling
1. A valid invoice waits for 2 approvals, then runs as a simulated payment.
2. A second in-policy payment (office rent) shows the same flow.
3. Unknown payees and spending over the rolling 24h limit are blocked.
4. A prompt injection produces a disallowed action and is thrown away.
5. Calling the execute endpoint directly returns 403 and is logged.
6. The audit log is a SHA-256 hash chain; any edit breaks it.

---

## Demo Video
- 2-minute demo video location: [`submission/demo_video/`](submission/demo_video/)
- Video outline:
  1. **The possibility**: Autonomous AI Agents executing critical tasks safely.
  2. **The constraint**: The risk of prompt injection, leaked API keys, and rogue tool calls.
  3. **The prototype**: Demonstrating live TideCloak authentication, quorum gatekeeping, and instant refusal.
  4. **What changes**: Organizations can delegate autonomy without surrendering unilateral control.

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
  - `LLM_MODEL=gemini-3.8-flash` and `LLM_FALLBACK_MODELS=gemini-3.5-flash,gemini-2.5-flash` (use model ids your key lists; `backend/check-llm.sh` tests them)

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
