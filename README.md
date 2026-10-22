[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

# Chao-Luon-37 | SentinelAgent

## Project overview

_One-sentence description: A zero-master-key autonomous AI agent guardrail powered by TideCloak Emergent Authority that prevents prompt-injection jailbreaks and unauthorized data exfiltration._

Built with [TideCloak](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked).

### 1. Vision & originality
Autonomous AI agents are revolutionizing workflows, but granting them raw API keys, database credentials, or unilateral execution power creates catastrophic security risks. **SentinelAgent** introduces a zero-master-key paradigm where AI agents never possess static secrets; tool execution and data decryption require dynamic, multi-party cryptographic quorum.

### 2. Trust constraint insight
Today, delegating high-stakes tasks to AI agents is blocked by fear of prompt injection, hallucinations, and rogue actions. Organizations cannot safely give agents access to financial tokens or customer databases because traditional IAM provides all-or-nothing power with static keys that can be leaked or stolen.

### 3. Value & impact
Enterprises can safely unleash autonomous agents for financial reconciliation, cloud DevOps, and customer operations. Even if an agent's LLM is completely jailbroken by malicious user inputs, sensitive assets remain cryptographically quarantined and inaccessible.

### 4. Why TideCloak matters
TideCloak provides **Emergent Authority**: authority synthesizes just-in-time only when policy, identity, and multi-node consensus align. No master key exists in the agent's prompt, memory, or host server. 4 independent Tide nodes verify policy boundaries and issue ephemeral, self-destructing session keys—refusing key release if an injection attack or unauthorized action is detected.

### 5. Prototype & storytelling
Our prototype demonstrates an interactive Agent Execution Console. Judges can observe:
1. **Legitimate Task:** Quorum verifies policy and synthesizes an ephemeral key to decrypt financial reports.
2. **Prompt Injection Jailbreak:** A hijacked agent attempts to dump customer PII, but Tide nodes unanimously refuse key synthesis, instantly sandboxing the threat.
3. **Host Root Bypass:** Demonstrates that even cloud operators cannot extract master keys.

> **Word count note**: The 5 prompt responses above contain under 260 words.

---

## Demo Video
- 2-minute demo video location: [`submission/demo_video/demo.mp4`](submission/demo_video/)
- Video outline:
  1. **The possibility**: Autonomous AI Agents executing critical tasks safely.
  2. **The constraint**: The risk of prompt injection, leaked API keys, and rogue tool calls.
  3. **The prototype**: Demonstrating live TideCloak Quorum gatekeeping and instant refusal.
  4. **What changes**: Organizations can delegate autonomy without surrendering unilateral control.

---

## Setup & Running the Prototype

### Prerequisites
- Modern web browser (Chrome, Edge, Safari, Firefox).
- Python 3 (standard on most systems).

### Quick Start
1. Clone the repository:
   ```bash
   git clone https://github.com/acccuatoi/Chao-Luon-37.git
   cd Chao-Luon-37/ui
   ```
2. Start the local server:
   ```bash
   python -m http.server 3000
   ```
3. Open `http://localhost:3000` in your browser.
