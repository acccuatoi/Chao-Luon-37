# Bản Thuyết Minh Dự Án (Pitch Overview Draft)
**Dự án:** Chao-Luon-37 | SentinelAgent  
**Cuộc thi:** UNLOCKED Hackathon (RMIT × Tide - Challenge 2)  
**Tiêu chí:** Dưới 300 từ cho 5 câu hỏi cốt lõi.

---

### Tóm tắt 1 câu (One-sentence description)
> *SentinelAgent is an AI agent guardrail where the agent can only propose actions; execution needs approval from two distinct TideCloak-authenticated humans, enforced by policy and logged in a tamper-evident audit chain.*

---

### 1. Vision & originality (Tầm nhìn & Tính độc đáo)
Autonomous AI agents are revolutionizing workflows, but granting them raw execution power or unilateral access creates catastrophic security risks. **SentinelAgent (Cháo Lươn 37)** enforces a strict separation of powers: AI agents can only formulate proposals; execution requires multi-party human quorum approval authenticated via TideCloak.

### 2. Trust constraint insight (Điểm nghẽn về niềm tin)
Delegating high-stakes tasks to AI agents is blocked by fear of prompt injection, hallucinations, and rogue actions. Organizations cannot safely give agents unilateral access to payments or sensitive operations because traditional IAM provides static keys that can be hijacked.

### 3. Value & impact (Giá trị & Tác động)
Enterprises can safely unleash autonomous agents for financial workflows and operations. Even if an agent's LLM is completely jailbroken by adversarial user inputs, sensitive actions remain strictly quarantined and cannot execute without human quorum.

### 4. Why TideCloak matters (Vai trò cốt lõi của TideCloak)
TideCloak enforces cryptographically verified identity and role-based gatekeeping (`requester`, `approver`). Every request is authenticated with access tokens. The agent possesses no unilateral execution authority, and quorum gates ensure independent human consensus before actions proceed.

### 5. Prototype & storytelling (Bản nguyên mẫu & Trình diễn)
Our prototype demonstrates an interactive Governance & Quorum Console:
1. **Legitimate Task (Bilingual):** AI structures English/Vietnamese requests into a payment proposal within policy, pending 2 human approvals.
2. **Policy Guard:** Transfers breaching rolling 24h caps ($5,000) or unwhitelisted payees are blocked.
3. **Prompt Injection Defense:** Hijacked instructions fail strict schema checks and are quarantined.
4. **Quorum Bypass Rejection:** Direct execution attempts return 403 Forbidden and are immutably audited.

---
**Word count (English 5 sections):** ~240 words (Compliant with < 300 words criteria).
