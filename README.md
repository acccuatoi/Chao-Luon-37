[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

# Chao-Luon-37 | SentinelAgent

## Project overview

_One-sentence description: A zero-master-key autonomous AI agent guardrail powered by TideCloak authentication and quorum approval gates that prevents prompt-injection jailbreaks and unauthorized execution._

Built with [TideCloak](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked).

### 1. Vision & originality
Autonomous AI agents are revolutionizing workflows, but granting them raw execution power or unilateral access creates catastrophic security risks. **SentinelAgent (Cháo Lươn 37)** enforces a zero-master-key paradigm: AI agents can *only* formulate proposals in natural language; execution requires multi-party human quorum approval authenticated via TideCloak.

### 2. Trust constraint insight
Delegating high-stakes tasks to AI agents is blocked by fear of prompt injection, hallucinations, and rogue actions. Organizations cannot safely give agents unilateral control over payments or data because traditional architectures provide all-or-nothing execution with static API keys that can be hijacked.

### 3. Value & impact
Enterprises can safely unleash autonomous agents for financial workflows and operations. Even if an agent's LLM is completely jailbroken by malicious user prompts, the agent holds no execution keys and cannot unilaterally disburse funds or export data.

### 4. Why TideCloak matters
TideCloak provides robust identity and role verification (`requester`, `approver`). Every request is verified via TideCloak access tokens. Multi-party quorum ensures that distinct authorized humans must review and sign proposals before any simulated action is executed. *(Decentralized 4/4 threshold key synthesis and hardware enclave E2EE are planned for the production roadmap).*

### 5. Prototype & storytelling
Our prototype demonstrates an interactive Governance & Quorum Console:
1. **Legitimate Task:** AI formulates a structured payment proposal within daily cap and whitelist; pending 2 human approvals.
2. **Vietnamese Language Support:** Natural language task in Vietnamese is accurately structured into formal action parameters.
3. **Policy Breach:** Transfer exceeding rolling 24h cap or targeting an unapproved payee is immediately blocked by Policy Guard.
4. **Prompt Injection Jailbreak:** Malicious instructions attempting unauthorized data exfiltration fail strict schema validation and are quarantined before reaching humans.
5. **Direct Execution Bypass Attempt:** Calling execution endpoints directly returns HTTP 403 Forbidden and records a `rejected` event in the audit log.

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
# Start TideCloak container on port 8080
docker run -p 8080:8080 --name tidecloak tideprotocol/tidecloak:latest
```

### 2. Install Monorepo Dependencies
```bash
npm run install:all
```

### 3. Run Backend & Frontend

#### Terminal 1: Backend API (Port 3001)
```bash
npm run dev:backend
# API available at http://localhost:3001/api/status
```

#### Terminal 2: Frontend UI (Port 3000)
```bash
# Live mode (talks to backend API on :3001):
npm run dev:frontend

# Or offline mock mode:
# NEXT_PUBLIC_USE_MOCK=true npm run dev:frontend
```
Open `http://localhost:3000` in your browser.
