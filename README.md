[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

# Chao-Luon-37 | SentinelAgent

## Project overview

_One-sentence description: An AI agent guardrail where the agent can only propose actions; execution needs approval from two distinct TideCloak-authenticated humans, enforced by policy and logged in a tamper-evident audit chain._

Built with [TideCloak](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked).

### 1. Vision & originality
Autonomous AI agents are revolutionizing workflows, but granting them raw execution power or unilateral access creates catastrophic security risks. **SentinelAgent (Cháo Lươn 37)** enforces a strict separation of powers: AI agents can *only* formulate proposals in natural language; execution requires multi-party human quorum approval authenticated via TideCloak.

### 2. Trust constraint insight
Delegating high-stakes tasks to AI agents is blocked by fear of prompt injection, hallucinations, and rogue actions. Organizations cannot safely give agents unilateral control over payments or data because traditional architectures provide all-or-nothing execution with static API keys that can be hijacked.

### 3. Value & impact
Enterprises can safely unleash autonomous agents for financial workflows and operations. Even if an agent's LLM is completely jailbroken by malicious user prompts, the agent holds no execution keys and cannot unilaterally disburse funds or export data.

### 4. Why TideCloak matters
TideCloak provides robust identity and role verification (`requester`, `approver`). Every request is verified via TideCloak access tokens. Multi-party quorum ensures that distinct authorized humans must review and sign proposals before any simulated action is executed, with all events recorded in a SHA-256 tamper-evident hash chain. *(Decentralized 4/4 threshold key synthesis and hardware enclave E2EE are planned for the production roadmap).*

### 5. Prototype & storytelling
Our prototype demonstrates an interactive Governance & Quorum Console:
1. **Legitimate Task:** AI formulates a structured payment proposal within daily cap and whitelist; pending 2 human approvals.
2. **Vietnamese Language Support:** Natural language task in Vietnamese is accurately structured into formal action parameters.
3. **Policy Breach:** Transfer exceeding rolling 24h cap ($5,000) or targeting an unapproved payee is immediately blocked by Policy Guard.
4. **Prompt Injection Jailbreak:** Malicious instructions attempting unauthorized data exfiltration fail strict schema validation and are quarantined before reaching humans.
5. **Direct Execution Bypass Attempt:** Calling execution endpoints directly returns HTTP 403 Forbidden and records a `rejected` event in the audit log.
6. **Tamper-Evident Audit Chain:** SHA-256 hash chain verification proves that no audit records have been altered, reordered, or deleted.

---

## Demo Video
- 2-minute demo video location: [`submission/demo_video/`](submission/demo_video/)
- Video outline:
  1. **The possibility**: Autonomous AI Agents executing critical tasks safely.
  2. **The constraint**: The risk of prompt injection, leaked API keys, and rogue tool calls.
  3. **The prototype**: Demonstrating live TideCloak authentication, quorum gatekeeping, and instant refusal.
  4. **What changes**: Organizations can delegate autonomy without surrendering unilateral control.

---

## Setup & Running the Prototype

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
  - `LLM_MODEL=gemini-2.0-flash` (or Groq / local Ollama model)

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
