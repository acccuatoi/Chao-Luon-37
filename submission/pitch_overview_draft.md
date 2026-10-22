# Bản Thuyết Minh Dự Án (Pitch Overview Draft)
**Dự án:** Chao-Luon-37 | SentinelAgent  
**Cuộc thi:** UNLOCKED Hackathon (RMIT × Tide - Challenge 2)  
**Tiêu chí:** Dưới 300 từ cho 5 câu hỏi cốt lõi.

---

### Tóm tắt 1 câu (One-sentence description)
> *SentinelAgent is a zero-master-key autonomous AI agent guardrail powered by TideCloak Emergent Authority that prevents prompt-injection jailbreaks and unauthorized data exfiltration.*

---

### 1. Vision & originality (Tầm nhìn & Tính độc đáo)
Autonomous AI agents are revolutionizing workflows, but granting them raw API keys, database credentials, or unilateral execution power creates catastrophic security risks. **SentinelAgent** introduces a zero-master-key paradigm where AI agents never possess static secrets; tool execution and data decryption require dynamic, multi-party cryptographic quorum.

### 2. Trust constraint insight (Điểm nghẽn về niềm tin)
Today, delegating high-stakes tasks to AI agents is blocked by fear of prompt injection, hallucinations, and rogue actions. Organizations cannot safely give agents access to financial tokens or customer databases because traditional IAM provides all-or-nothing power with static keys that can be leaked or stolen.

### 3. Value & impact (Giá trị & Tác động)
Enterprises can safely unleash autonomous agents for financial reconciliation, cloud DevOps, and customer operations. Even if an agent's LLM is completely jailbroken by malicious user inputs, sensitive assets remain cryptographically quarantined and inaccessible.

### 4. Why TideCloak matters (Vai trò cốt lõi của TideCloak)
TideCloak provides **Emergent Authority**: authority synthesizes just-in-time only when policy, identity, and multi-node consensus align. No master key exists in the agent's prompt, memory, or host server. 4 independent Tide nodes verify policy boundaries and issue ephemeral, self-destructing session keys—refusing key release if an injection attack or unauthorized action is detected.

### 5. Prototype & storytelling (Bản nguyên mẫu & Trình diễn)
Our prototype demonstrates an interactive Agent Execution Console. Judges can observe:
1. **Legitimate Task:** Quorum verifies policy and synthesizes an ephemeral key to decrypt financial reports.
2. **Prompt Injection Jailbreak:** A hijacked agent attempts to dump customer PII, but Tide nodes unanimously refuse key synthesis, instantly sandboxing the threat.
3. **Host Root Bypass:** Demonstrates that even cloud operators cannot extract master keys.

---
**Số từ tiếng Anh:** ~255 từ (Đạt chuẩn < 300 từ của cuộc thi).
